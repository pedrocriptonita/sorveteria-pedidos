const FASE_2 = [
  "Supabase Auth (email + senha) para o backoffice",
  "Sessão via cookies + middleware (@supabase/ssr)",
  "Papéis ADMIN e COZINHA (tabela UsuarioAdmin)",
  "Rotas protegidas: /admin e /cozinha",
  "RLS habilitado (deny-by-default) em todas as tabelas",
];

const PROXIMO = "Fase 3 — Validação das APIs externas (PSP de PIX + impressão).";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 p-8">
      <header className="flex flex-col gap-2">
        <span className="text-sm font-medium text-neutral-500">
          Fase 2 — Autenticação
        </span>
        <h1 className="text-3xl font-bold">Sorveteria · Sistema de Pedidos</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Autenticação do backoffice no ar. As features (catálogo, pedido,
          impressão, KDS e admin) entram nas próximas fases.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Concluído nesta fase
        </h2>
        <ul className="flex flex-col gap-2">
          {FASE_2.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm">
              <span aria-hidden className="mt-0.5 text-green-600">
                ✓
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-4 text-sm dark:border-neutral-800">
        <p className="font-medium">Como testar</p>
        <p className="text-neutral-600 dark:text-neutral-400">
          Acesse o backoffice em{" "}
          <a href="/login" className="font-mono underline underline-offset-2">
            /login
          </a>{" "}
          · health check em{" "}
          <a
            href="/api/health"
            className="font-mono underline underline-offset-2"
          >
            /api/health
          </a>
          .
        </p>
        <p className="text-neutral-600 dark:text-neutral-400">
          Próximo: {PROXIMO}
        </p>
      </section>
    </main>
  );
}
