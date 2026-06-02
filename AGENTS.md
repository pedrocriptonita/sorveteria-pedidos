# AGENTS.md

Convenções para agentes de código neste repositório.

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript · TailwindCSS 4 · shadcn/ui
- Supabase (Auth + Postgres) · Prisma · Supabase Realtime (KDS)
- Pagamentos: PSP de PIX (cobrança + webhook). Impressão: agente ESC/POS ou cloud-print.

## Estrutura

- `src/app` — rotas (App Router). Server Components por padrão.
- `src/features/<slice>` — vertical slices: `catalogo`, `pedido`, `impressao`, `admin`.
- `src/lib` — clients e utilitários (`prisma.ts`, `env.ts`, `supabase/`).
- `src/components/ui` — componentes compartilhados (shadcn entra na Fase 8).
- `prisma/schema.prisma` — fonte da verdade do banco.

## Regras

- Cada feature é um slice completo: DB + backend + frontend juntos.
- Validar Auth, webhook do PSP e impressão antes das features (risco primeiro).
- Não usar `localStorage`/`sessionStorage` em código que roda no servidor.
- Rodar `npm run lint` e `npm run typecheck` antes de abrir PR (o `build` não roda mais o linter no Next 16).

## Comandos

```bash
npm run dev          # desenvolvimento
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm run build        # prisma generate + next build
npm run db:migrate   # prisma migrate dev
```
