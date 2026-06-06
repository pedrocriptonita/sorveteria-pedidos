# DevoraFood — Sistema de Pedidos e Cardápio Digital

Plataforma própria de pedidos e cardápio digital (single-tenant): cardápio com
"monte seu açaí", subcategorias, carrinho, checkout, pagamento (PIX + dinheiro),
impressão automática na cozinha, painel da cozinha (KDS) e painel administrativo.

> **Status:** Fase 8 **concluída** (UI shell + identidade da marca; admin com
> dashboard, barra lateral e cores). **Em andamento: Fase 9 — polimento**
> (performance, segurança, observabilidade, UX). O backlog de *hardening* para
> deixar production-ready está em [docs/MELHORIAS.md](docs/MELHORIAS.md).

## Funcionalidades

**Cliente (storefront)**
- Cardápio por categorias e **subcategorias** (acordeão), com layout por
  categoria (carrossel horizontal ou grade em linha compacta).
- "Monte seu açaí" com tamanhos, grupos de opções e regra de **cota grátis**.
- Carrinho em `localStorage` (editar item, ajustar quantidade).
- **Login leve** (nome + telefone) no hub `/pedidos`, checkout (PIX/dinheiro) e
  **histórico de compras** com **repetir pedido**.

**Admin (`/admin`)**
- Catálogo: categorias, subcategorias, produtos simples e montáveis.
- **Dashboard do dia** (recebidos/entregues/cancelados) + **faturamento mensal**
  (filtro dos últimos 3 meses).
- Configuração da loja (pausar, taxa, pedido mínimo, zonas), clientes e pedidos
  (cancelar com estorno PIX).

**Cozinha (`/cozinha`)**
- KDS com avanço de status e fila de impressão resiliente (retry + reimprimir).

> Passo a passo de validação de cada fase: **[docs/FASES.md](docs/FASES.md)**.

## Stack

- **Frontend:** Next.js 16 (App Router) · React 19 · TypeScript · TailwindCSS 4 · shadcn/ui
- **Banco + Auth:** Supabase (PostgreSQL + Auth) · Prisma
- **Validação:** Zod · **Testes:** Vitest
- **Pagamentos:** PSP de PIX Cobrança — Asaas (webhook + polling de backup)
- **Impressão:** agente local ESC/POS **ou** impressora cloud-print
- **Hospedagem:** Vercel + Supabase

## Requisitos

- Node.js **≥ 20.9**
- Conta no Supabase e em um PSP de PIX (Asaas)

## Como rodar

```bash
# 1. Instalar dependências (gera o Prisma Client via postinstall)
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local   # preencha DATABASE_URL, Supabase, PSP, etc.

# 3. Banco: aplicar RLS e popular dados de exemplo
npm run db:rls
npm run db:seed

# 4. Criar o primeiro usuário do backoffice
npm run create-admin -- dono@exemplo.com "SenhaForte123!" "Dono" ADMIN

# 5. Subir o ambiente de desenvolvimento
npm run dev
```

Acesse http://localhost:3000 (loja) e `/login` (backoffice). Detalhes de
configuração de cada integração em [docs/FASES.md](docs/FASES.md).

## Scripts

| Script | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | `prisma generate` + `next build` |
| `npm run start` | Servidor de produção |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Testes unitários (Vitest) — motor de preço |
| `npm run test:watch` | Vitest em modo watch |
| `npm run db:push` | `prisma db push` — sincroniza o schema sem migration |
| `npm run db:studio` | Prisma Studio |
| `npm run db:rls` | Aplica `prisma/rls.sql` (habilita RLS nas tabelas) |
| `npm run db:seed` | Popula o cardápio com dados de exemplo (idempotente) |
| `npm run create-admin` | Cria usuário do backoffice (Auth + UsuarioAdmin) |
| `npm run validate:psp` | Testa a conexão com o PSP de PIX (Asaas) |
| `npm run validate:print` | Valida a fila de impressão de ponta a ponta |
| `npm run poll:pagamentos` | Concilia pagamentos PIX pendentes (backup do webhook) |

> Ao **criar uma tabela nova** no schema, adicione-a ao `prisma/rls.sql` e rode
> `npm run db:rls` (senão fica exposta via PostgREST com a chave anônima).

## Estrutura

```
src/
├─ app/                 # rotas (App Router): (loja), admin, cozinha, login, api
├─ features/            # vertical slices (data.ts / actions.ts / types.ts)
│  ├─ catalogo/         # catálogo, montável, subcategorias, carrinho
│  ├─ pedido/           # checkout, pedido, pagamento, histórico, schema (Zod)
│  ├─ impressao/        # fila de impressão + KDS
│  └─ admin/            # catálogo, configuração e operação
├─ lib/                 # prisma, env, supabase, psp, print, secure-compare
└─ components/ui/       # componentes shadcn compartilhados
prisma/schema.prisma     # modelo de dados (fonte da verdade)
docs/                    # FASES.md (validação) · MELHORIAS.md (backlog Fase 9)
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
7. **Admin: configurações e operação** ✅
8. **UI Shell e identidade da marca** ✅ _(admin refinado; subcategorias; hub do cliente)_
9. **Polimento (performance, segurança, observabilidade, UX)** 🔄 _em andamento_
   - ✅ RLS em todas as tabelas · rate-limit no checkout · token em tempo constante.
   - ✅ Validação Zod · fim do N+1 · testes do motor de preço · CI com `npm ci`/test.
   - ⏳ Produto: banners, horários, substituição de item, refino do KDS.
   - ⏳ Demais itens de *hardening*: ver [docs/MELHORIAS.md](docs/MELHORIAS.md).
```
