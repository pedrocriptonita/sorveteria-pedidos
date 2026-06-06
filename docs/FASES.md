# Guia de validação por fase (histórico de desenvolvimento)

Este documento é o "diário de fases" do projeto — passo a passo para validar
cada fase manualmente. O `README.md` traz a visão de produto enxuta; aqui ficam
os detalhes de teste de cada etapa.

## Fase 1 — Setup

- Página inicial em `/` mostra o status do setup.
- **Health check:** `GET /api/health` deve responder `{ "status": "ok", ... }`.
- `npm run lint`, `npm run typecheck`, `npm test` e `npm run build` devem passar
  (o CI roda os quatro).

## Fase 2 — Autenticação

1. No painel do Supabase → **Project Settings → API**, copie a `anon public` e a
   `service_role` para o `.env.local` (`NEXT_PUBLIC_SUPABASE_ANON_KEY` e
   `SUPABASE_SERVICE_ROLE_KEY`). A `NEXT_PUBLIC_SUPABASE_URL` já está preenchida.
2. Crie o primeiro usuário:
   ```bash
   npm run create-admin -- dono@exemplo.com "SenhaForte123!" "Dono" ADMIN
   ```
3. `npm run dev` e acesse `/login`. Após entrar:
   - **ADMIN** cai em `/admin`; **COZINHA** cai em `/cozinha`.
   - Acessar `/admin` ou `/cozinha` sem sessão redireciona para `/login`.
   - Um usuário COZINHA tentando `/admin` é mandado para `/cozinha`.
4. O RLS é aplicado com `npm run db:rls` (deny-by-default; o acesso real é via
   Prisma no servidor). **Reexecute sempre que criar uma tabela nova.**

## Fase 3 — Integrações externas (PIX + impressão)

Fase de **validação de risco**: prova que PIX (Asaas) e impressão funcionam,
antes de construir o fluxo de pedido (Fase 5).

**PIX — Asaas:**
1. Crie uma conta sandbox em https://sandbox.asaas.com e gere a API Key em
   *Configurações → Integrações → API Key*. Cole em `PSP_API_KEY` no `.env.local`.
2. Valide a conexão: `npm run validate:psp` (deve responder `✓ Asaas acessível`).
3. Webhook: configure no painel Asaas a URL `https://SEU_DOMINIO/api/webhooks/psp`
   e um token; cole o mesmo token em `PSP_WEBHOOK_SECRET`. O endpoint valida o
   header `asaas-access-token` (comparação em tempo constante).
4. Backup do webhook: `npm run poll:pagamentos` concilia cobranças pendentes.

**Impressão — agente local (ESC/POS):**
1. Defina um `PRINT_AGENT_TOKEN` no `.env.local` (qualquer segredo forte).
2. Valide a fila (sem hardware): `npm run validate:print` — cria um pedido de
   teste, enfileira, busca e marca como impresso, e limpa tudo.
3. Contrato do agente (rodando na loja):
   - `GET /api/print/jobs` (header `Authorization: Bearer <PRINT_AGENT_TOKEN>`)
     retorna os jobs PENDENTE com o `conteudo` da comanda.
   - `PATCH /api/print/jobs/<id>` com `{"status":"IMPRESSO"}` ou
     `{"status":"ERRO","erro":"..."}` reporta o resultado (retry automático).

> **Nota (Windows):** se `npm run build` falhar com `EPERM ... query_engine`,
> pare o `npm run dev` — o dev server trava a DLL do Prisma durante o
> `prisma generate`. Na Vercel (Linux) não ocorre.

## Fase 4 — Catálogo + carrinho

1. Popule o cardápio: `npm run db:seed` (cria "Monte seu Açaí" + bebidas).
2. `npm run dev` e acesse `/`:
   - O cardápio lista as categorias e produtos (e subcategorias, se houver).
   - **Monte seu Açaí:** clique em *Montar* → escolha tamanho, creme
     (obrigatório), acompanhamentos (3 grátis, extras cobrados) e adicionais.
     O preço atualiza ao vivo e o botão só habilita com a seleção válida.
   - **Bebidas:** *Adicionar* coloca direto no carrinho.
3. O carrinho (`/carrinho`) persiste no `localStorage`, permite ajustar
   quantidade, **editar** e remover.

> **Regra de preço (cota grátis):** num grupo com `cotaGratis = N`, os `N`
> itens **mais baratos** saem de graça e os demais são cobrados. Definido em
> `src/features/catalogo/pricing.ts` (com testes em `pricing.test.ts`).

## Fase 5 — Checkout + pagamento

Pré-requisitos: `npm run db:seed` e a `PSP_API_KEY` do Asaas no `.env.local`.

1. Monte um pedido e vá ao carrinho → **Finalizar** → `/pedidos` (login leve).
2. **Checkout:** nome, telefone, entrega (retirada/delivery) e forma:
   - **Dinheiro:** o pedido entra direto `NA_FILA` e a comanda é enfileirada
     para impressão. (Cliente bloqueado não pode pagar em dinheiro — anti-trote.)
   - **PIX:** o cliente **não digita CPF** (estilo iFood). O app cria a cobrança
     no Asaas usando o CPF/CNPJ da loja (`PSP_CPF_CNPJ`) e mostra o QR Code +
     copia-e-cola. A tela faz polling: ao confirmar, o pedido vai para `NA_FILA`.
3. O preço é **sempre recalculado no servidor** (o carrinho do cliente não é
   confiável) e o payload é validado com Zod. Pedido mínimo e taxa vêm da
   `ConfigLoja`. Há rate-limit anti-abuso (1 pedido pendente por cliente/60s).
4. Confirmação do PIX: por **webhook** (`/api/webhooks/psp`) e como backup por
   **polling** (`npm run poll:pagamentos`) e pela própria tela de status.

> **Notas do Asaas (sandbox):** a cobrança PIX exige um **CPF/CNPJ** — usamos o
> da **loja** (`PSP_CPF_CNPJ`). Há **valor mínimo de R$ 5,00** por cobrança; por
> isso o pedido mínimo é R$ 15,00. Em produção, troque pelo CPF/CNPJ real.

## Fase 6 — KDS + impressão

1. Login no backoffice (`/login`) como **ADMIN** ou **COZINHA** e abra `/cozinha`.
2. Crie um pedido na loja. Ele aparece no board do KDS na coluna **Na fila**.
   O painel atualiza sozinho a cada 7s (polling).
3. Avance pelos botões: **Iniciar preparo** → **Marcar pronto** → **Saiu para
   entrega**/**Entregue**. Em pedido de dinheiro, ao marcar *Entregue* o
   pagamento é confirmado automaticamente.
4. **Impressão:** quando o agente imprime (`PATCH /api/print/jobs/<id>` com
   `IMPRESSO`), o pedido passa de `NA_FILA` para `IMPRESSO`. Jobs com erro ou
   presos aparecem no monitor no topo, com botão **Reimprimir**.

> **Tempo real:** o KDS usa **polling** (a cada 7s) em vez de Supabase Realtime —
> encaixa na arquitetura via Prisma + RLS deny-by-default. Trocar por Realtime
> depois é um drop-in.

## Fase 7 — Admin (catálogo + config/operação)

Login como **ADMIN** em `/login`.

- **Catálogo** (`/admin/catalogo`): categorias (criar, renomear, ativar,
  reordenar, excluir, **layout** carrossel/grade), **subcategorias** (linhas) e
  produtos (simples ou *montável*, esgotar, editar, excluir). Montáveis abrem o
  **editor** (`/admin/produto/<id>`): tamanhos, grupos de opções e itens, com
  atalhos "Preencher com Sabores de Sorvete/Açaí".
- **Configuração** (`/admin/config`): pausar/retomar pedidos, nome da loja, tipo
  de taxa (fixa/por bairro), pedido mínimo e zonas de entrega.
- **Pedidos** (`/admin/pedidos`): dashboard do dia + faturamento mensal (filtro
  3 meses) + lista; **Cancelar** (PIX pago → estorno total no Asaas).
- **Clientes** (`/admin/clientes`): bloquear/desbloquear (anti-trote).

> Exclusões são *soft-delete* (não somem do histórico de pedidos).

## Fase 8 — Identidade visual

- **shadcn/ui** (estilo new-york) em `src/components/ui/` + `cn()` em
  `src/lib/utils.ts` e `components.json`.
- **Tema vermelho/branco** (light-only) em `src/app/globals.css` via tokens CSS
  (`--primary`, `--background`). Para ajustar a marca, mude os tokens em `:root`.
- **Storefront** do cliente e **admin** (dashboard, barra lateral, cores) com a
  marca. KDS recebe refino no polimento (Fase 9).
