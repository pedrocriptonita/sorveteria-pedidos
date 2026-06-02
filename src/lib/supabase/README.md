# Clientes Supabase (Fase 2)

- `client.ts` — `createClient()` para Client Components (browser, chave anon).
- `server.ts` — `createClient()` async para Server Components / Actions / Route
  Handlers (lê/escreve sessão nos cookies).
- `middleware.ts` — `updateSession()` renova a sessão e protege rotas; usado por
  `src/middleware.ts`.
- `admin.ts` — `createAdminClient()` com a chave service_role (somente servidor;
  ignora RLS). Usado por scripts/admin.

A autorização (sessão + papel) fica em `src/lib/auth/`.
