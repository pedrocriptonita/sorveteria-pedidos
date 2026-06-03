# Sorveteria — Sistema de Pedidos (MVP)

Sistema próprio de pedidos e cardápio digital para uma sorveteria (single-tenant):
cardápio com "monte seu açaí", carrinho, checkout, pagamento (PIX + dinheiro),
impressão automática na cozinha, painel da cozinha (KDS) e painel administrativo.

> **Status:** Fase 7 — Admin (catálogo + configuração + operação) no ar. Próxima: Fase 8 (UI shell + shadcn). Pendências menores: banners, horários e substituição de item.

## Stack

- **Frontend:** Next.js 16 (App Router) · React 19 · TypeScript · TailwindCSS 4 · shadcn/ui
- **Banco + Auth:** Supabase (PostgreSQL + Auth) · Prisma
- **Tempo real:** Supabase Realtime (KDS)
- **Pagamentos:** PSP de PIX Cobrança (webhook + polling de backup)
- **Impressão:** agente local ESC/POS **ou** impressora cloud-print
- **Hospedagem:** Vercel + Supabase

## Requisitos

- Node.js **≥ 20.9**
- Conta no Supabase (Fase 2) e em um PSP de PIX (Fase 3)

## Como rodar

```bash
# 1. Instalar dependências (gera o Prisma Client via postinstall)
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local
# preencha DATABASE_URL etc. (Supabase entra na Fase 2)

# 3. Subir o ambiente de desenvolvimento
npm run dev
```

Acesse http://localhost:3000.

### Como testar a Fase 1

- Página inicial em `/` mostra o status do setup.
- **Health check:** `GET /api/health` deve responder `{ "status": "ok", ... }`.
- `npm run lint`, `npm run typecheck` e `npm run build` devem passar (o CI roda os três).

### Como testar a Fase 2 (autenticação)

1. No painel do Supabase → **Project Settings → API**, copie a `anon public` e a
   `service_role` para o `.env.local` (`NEXT_PUBLIC_SUPABASE_ANON_KEY` e
   `SUPABASE_SERVICE_ROLE_KEY`). A `NEXT_PUBLIC_SUPABASE_URL` já está preenchida.
2. Crie o primeiro usuário:
   ```bash
   npm run create-admin -- dono@sorveteria.com "SenhaForte123!" "Dono" ADMIN
   ```
3. `npm run dev` e acesse `/login`. Após entrar:
   - **ADMIN** cai em `/admin`; **COZINHA** cai em `/cozinha`.
   - Acessar `/admin` ou `/cozinha` sem sessão redireciona para `/login`.
   - Um usuário COZINHA tentando `/admin` é mandado para `/cozinha`.
4. O RLS já foi aplicado com `npm run db:rls` (deny-by-default; o acesso real é
   via Prisma no servidor). Reexecute se recriar o banco.

### Como testar a Fase 3 (integrações externas)

Fase de **validação de risco**: prova que PIX (Asaas) e impressão funcionam,
antes de construir o fluxo de pedido (Fase 5).

**PIX — Asaas:**
1. Crie uma conta sandbox em https://sandbox.asaas.com e gere a API Key em
   *Configurações → Integrações → API Key*. Cole em `PSP_API_KEY` no `.env.local`.
2. Valide a conexão: `npm run validate:psp` (deve responder `✓ Asaas acessível`).
3. Webhook: configure no painel Asaas a URL `https://SEU_DOMINIO/api/webhooks/psp`
   e um token; cole o mesmo token em `PSP_WEBHOOK_SECRET`. Em produção/preview o
   Asaas envia eventos `PAYMENT_*`; o endpoint valida o header `asaas-access-token`.
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

### Como testar a Fase 4 (catálogo + carrinho)

1. Popule o cardápio: `npm run db:seed` (cria "Monte seu Açaí" + bebidas).
2. `npm run dev` e acesse `/`:
   - O cardápio lista as categorias e produtos.
   - **Monte seu Açaí:** clique em *Montar* → escolha tamanho, creme
     (obrigatório), acompanhamentos (3 grátis, extras cobrados) e adicionais.
     O preço atualiza ao vivo e o botão só habilita com a seleção válida.
   - **Bebidas:** *Adicionar* coloca direto no carrinho.
3. O carrinho (`/carrinho`) persiste no `localStorage`, permite ajustar
   quantidade e remover. O botão *Finalizar* fica para a Fase 5 (checkout).

> **Regra de preço (cota grátis):** num grupo com `cotaGratis = N`, os `N`
> itens **mais baratos** saem de graça e os demais são cobrados. Definido em
> `src/features/catalogo/pricing.ts` — fácil de inverter se a loja preferir.

### Como testar a Fase 5 (checkout + pagamento)

Pré-requisitos: `npm run db:seed` (cria a loja + cardápio) e a `PSP_API_KEY`
do Asaas no `.env.local`.

1. `npm run dev`, monte um pedido no cardápio e vá ao carrinho → **Finalizar**.
2. **Checkout:** informe nome, telefone, entrega (retirada/delivery) e a forma:
   - **Dinheiro:** o pedido entra direto `NA_FILA` e a comanda é enfileirada
     para impressão. (Cliente bloqueado não pode pagar em dinheiro — anti-trote.)
   - **PIX:** o cliente **não digita CPF** (estilo iFood). O app cria a cobrança
     no Asaas usando o CPF/CNPJ da loja (`PSP_CPF_CNPJ`) e mostra o QR Code +
     copia-e-cola. A tela faz polling: ao confirmar o pagamento, o pedido vai
     para `NA_FILA` e imprime.
3. O preço é **sempre recalculado no servidor** (o carrinho do cliente não é
   confiável). Pedido mínimo e taxa de entrega vêm da `ConfigLoja`.
4. Confirmação do PIX: por **webhook** (`/api/webhooks/psp`, precisa de URL
   pública) e como backup por **polling** (`npm run poll:pagamentos`) e pela
   própria tela de status (checagem ao vivo no PSP).

> **Notas do Asaas (sandbox):** a cobrança PIX exige um **CPF/CNPJ** — usamos o
> da **loja** (`PSP_CPF_CNPJ`), não o do cliente (ele não digita nada). Há
> **valor mínimo de R$ 5,00** por cobrança; por isso o pedido mínimo é R$ 15,00.
> Em produção, troque `PSP_CPF_CNPJ` pelo CPF/CNPJ real da loja.

### Como testar a Fase 6 (KDS + impressão)

1. Faça login no backoffice (`/login`) com um usuário **ADMIN** ou **COZINHA**
   e abra `/cozinha`.
2. Crie um pedido na loja (Fase 5). Ele aparece no board do KDS na coluna
   **Na fila**. O painel atualiza sozinho a cada 7s (polling).
3. Avance o pedido pelos botões: **Iniciar preparo** → **Marcar pronto** →
   **Saiu para entrega**/**Entregue**. Em pedido de dinheiro, ao marcar
   *Entregue* o pagamento é confirmado automaticamente.
4. **Impressão:** quando o agente imprime a comanda
   (`PATCH /api/print/jobs/<id>` com `IMPRESSO`), o pedido passa de `NA_FILA`
   para `IMPRESSO`. Jobs **com erro** ou presos aparecem no monitor no topo do
   painel, com botão **Reimprimir** (gera um novo job).

> **Tempo real:** o KDS usa **polling** (`router.refresh` a cada 7s) em vez de
> Supabase Realtime — encaixa na arquitetura via Prisma + RLS deny-by-default,
> sem abrir políticas. Trocar por Realtime depois é um drop-in.

### Como testar a Fase 7 (CRUD do catálogo)

Login como **ADMIN** em `/login`, depois acesse `/admin/catalogo`.

- **Categorias:** criar, renomear, ativar/desativar, reordenar (↑/↓) e excluir.
- **Produtos:** adicionar (simples com preço, ou marcar *montável*), marcar
  esgotado/disponível, editar e excluir. Produtos montáveis abrem o **editor**.
- **Editor do montável** (`/admin/produto/<id>`): gerenciar **tamanhos**
  (nome + preço base), **grupos de opções** (tipo único/múltiplo, mín/máx, cota
  grátis, obrigatório) e os **itens** de cada grupo (preço extra + esgotar).
- As mudanças refletem no cardápio do cliente (`/`) na hora.

> O catálogo agora é editável pelo admin — o `npm run db:seed` continua útil só
> para popular dados de exemplo do zero. Exclusões são *soft-delete* (não somem
> do histórico de pedidos).

### Como testar a Fase 7 — parte 2 (config + operação)

Login como **ADMIN**; o menu do admin tem Catálogo, Pedidos, Clientes e
Configuração.

- **Configuração** (`/admin/config`): **Pausar/Retomar** pedidos (o checkout
  bloqueia quando pausado), nome da loja, **tipo de taxa** (fixa ou por bairro),
  taxa fixa, pedido mínimo e **zonas de entrega** (bairro + taxa + tempo).
- **Pedidos** (`/admin/pedidos`): lista os mais recentes; **Cancelar** um pedido
  — se for PIX já pago, dispara o **estorno total** no Asaas; se for PIX ainda
  aguardando, cancela a cobrança; dinheiro só marca como cancelado.
- **Clientes** (`/admin/clientes`): **bloquear/desbloquear** (cliente bloqueado
  não consegue pagar em dinheiro — anti-trote).

## Scripts

| Script | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | `prisma generate` + `next build` |
| `npm run start` | Servidor de produção |
| `npm run lint` | ESLint (o `build` não roda mais o linter no Next 16) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:migrate` | `prisma migrate dev` (usa `.env.local` via dotenv-cli) |
| `npm run db:push` | `prisma db push` — sincroniza o schema sem migration |
| `npm run db:studio` | Prisma Studio |
| `npm run db:rls` | Aplica `prisma/rls.sql` (habilita RLS nas tabelas) |
| `npm run db:seed` | Popula o cardápio com dados de exemplo (idempotente) |
| `npm run create-admin` | Cria usuário do backoffice (Auth + UsuarioAdmin) |
| `npm run validate:psp` | Testa a conexão com o PSP de PIX (Asaas) |
| `npm run validate:print` | Valida a fila de impressão de ponta a ponta |
| `npm run poll:pagamentos` | Concilia pagamentos PIX pendentes (backup do webhook) |

## Estrutura

```
src/
├─ app/                 # rotas (App Router) + api/health
├─ features/            # vertical slices
│  ├─ catalogo/         # Fase 4 — catálogo, montável, carrinho
│  ├─ pedido/           # Fase 5 — checkout, pedido, pagamento
│  ├─ impressao/        # Fase 6 — fila de impressão + KDS
│  └─ admin/            # Fase 7 — configurações e operação
├─ lib/                 # prisma.ts, env.ts, supabase/
├─ components/ui/        # componentes compartilhados (shadcn na Fase 8)
└─ types/
prisma/schema.prisma     # modelo de dados (fonte da verdade)
```

## Deploy

1. Importar o repositório na Vercel (framework Next.js detectado automaticamente).
2. Definir as variáveis de ambiente do `.env.example` no painel da Vercel.
3. `vercel.json` já define `prisma generate && next build` como build command.

## Roadmap (fases)

1. **Setup inicial** ✅
2. **Autenticação (Supabase Auth + Prisma + RLS)** ✅
3. **Validação das APIs externas (PSP de PIX + impressão)** ✅
4. **Catálogo + Monte seu açaí + Carrinho** ✅
5. **Checkout + Pedido + Pagamento (PIX/dinheiro)** ✅
6. **Fila de impressão + KDS** ✅
7. **Admin: configurações e operação** ✅ _(banners, horários e substituição de item ficam para o polimento)_
8. UI Shell e refatoração (shadcn)
9. Polimento (performance, segurança, observabilidade, UX)
```
