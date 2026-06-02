# Sorveteria — Sistema de Pedidos (MVP)

Sistema próprio de pedidos e cardápio digital para uma sorveteria (single-tenant):
cardápio com "monte seu açaí", carrinho, checkout, pagamento (PIX + dinheiro),
impressão automática na cozinha, painel da cozinha (KDS) e painel administrativo.

> **Status:** Fase 2 — Autenticação concluída. Próxima: Fase 3 (APIs externas: PIX + impressão).

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
| `npm run create-admin` | Cria usuário do backoffice (Auth + UsuarioAdmin) |

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
3. Validação das APIs externas (PSP de PIX + impressão)
4. Catálogo + Monte seu açaí + Carrinho
5. Checkout + Pedido + Pagamento (PIX/dinheiro)
6. Fila de impressão + KDS
7. Admin: configurações e operação
8. UI Shell e refatoração (shadcn)
9. Polimento (performance, segurança, observabilidade, UX)
```
