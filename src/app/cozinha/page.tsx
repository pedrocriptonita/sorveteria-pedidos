import { requireCozinha } from "@/lib/auth/session";
import { getMonitorImpressao, getPedidosCozinha } from "@/features/impressao/data";
import { reimprimirAction } from "@/features/impressao/actions";
import { AutoRefresh } from "@/features/impressao/components/auto-refresh";
import { PedidoCozinhaCard } from "@/features/impressao/components/pedido-cozinha-card";
import type { PedidoCozinha } from "@/features/impressao/types";

// Painel operacional: sempre fresco, atualizado por polling no client.
export const dynamic = "force-dynamic";

const COLUNAS: { titulo: string; status: PedidoCozinha["status"][] }[] = [
  { titulo: "Na fila", status: ["NA_FILA", "IMPRESSO"] },
  { titulo: "Em preparo", status: ["EM_PREPARO"] },
  { titulo: "Pronto / Entrega", status: ["PRONTO", "SAIU_PARA_ENTREGA"] },
];

export default async function CozinhaPage() {
  await requireCozinha();
  const [pedidos, jobs] = await Promise.all([
    getPedidosCozinha(),
    getMonitorImpressao(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <AutoRefresh />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cozinha (KDS)</h1>
        <span className="text-xs text-neutral-500">
          atualiza a cada 7s · {pedidos.length} ativo(s)
        </span>
      </div>

      {/* Monitor de impressão: jobs pendentes/com erro */}
      {jobs.length > 0 ? (
        <section className="flex flex-col gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
          <h2 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
            Impressão — atenção ({jobs.length})
          </h2>
          <ul className="flex flex-col gap-1">
            {jobs.map((job) => (
              <li
                key={job.id}
                className="flex items-center justify-between gap-2 text-xs text-amber-800 dark:text-amber-200"
              >
                <span>
                  #{job.pedidoNumero} ·{" "}
                  {job.status === "ERRO"
                    ? `falhou (${job.tentativas} tentativas)`
                    : "aguardando impressora"}
                  {job.ultimoErro ? ` — ${job.ultimoErro}` : ""}
                </span>
                <form action={reimprimirAction}>
                  <input type="hidden" name="pedidoId" value={job.pedidoId} />
                  <button
                    type="submit"
                    className="rounded border border-amber-400 px-2 py-0.5 font-medium hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900"
                  >
                    Reimprimir
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {pedidos.length === 0 ? (
        <p className="py-16 text-center text-neutral-500">
          Nenhum pedido na fila. 🍦
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {COLUNAS.map((coluna) => {
            const daColuna = pedidos.filter((p) =>
              coluna.status.includes(p.status),
            );
            return (
              <section key={coluna.titulo} className="flex flex-col gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                  {coluna.titulo} ({daColuna.length})
                </h2>
                {daColuna.map((pedido) => (
                  <PedidoCozinhaCard key={pedido.id} pedido={pedido} />
                ))}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
