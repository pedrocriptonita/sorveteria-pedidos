import Link from "next/link";
import { getPedidosAdmin } from "@/features/admin/operacao-data";
import { cancelarPedido } from "@/features/admin/operacao-actions";
import { formatBRL } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  PAGO: "Pago",
  NA_FILA: "Na fila",
  IMPRESSO: "Impresso",
  EM_PREPARO: "Em preparo",
  PRONTO: "Pronto",
  SAIU_PARA_ENTREGA: "Saiu p/ entrega",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
};

function dataCurta(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function PedidosAdminPage() {
  const pedidos = await getPedidosAdmin();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Pedidos</h1>

      {pedidos.length === 0 ? (
        <p className="py-16 text-center text-neutral-500">
          Nenhum pedido ainda.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-neutral-100 dark:divide-neutral-800">
          {pedidos.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-2 py-3"
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-bold">#{p.numero}</span>
                  <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs dark:bg-neutral-800">
                    {STATUS_LABEL[p.status] ?? p.status}
                  </span>
                  <span className="text-neutral-500">
                    {p.formaPagamento === "DINHEIRO" ? "💵" : "PIX"} ·{" "}
                    {formatBRL(p.total)}
                  </span>
                </div>
                <span className="text-xs text-neutral-500">
                  {p.clienteNome} · {p.clienteTelefone} · {dataCurta(p.criadoEm)}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <Link
                  href={`/pedido/${p.id}`}
                  className="rounded-md border border-neutral-300 px-2 py-1 text-xs transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  Ver
                </Link>
                {p.podeCancelar ? (
                  <form action={cancelarPedido}>
                    <input type="hidden" name="id" value={p.id} />
                    <button
                      type="submit"
                      className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
                      title={
                        p.formaPagamento === "PIX"
                          ? "Cancela e estorna o PIX (se já pago)"
                          : "Cancela o pedido"
                      }
                    >
                      Cancelar
                    </button>
                  </form>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-neutral-400">
        Mostrando os pedidos mais recentes. Cancelar um PIX já pago dispara o
        estorno total no PSP.
      </p>
    </div>
  );
}
