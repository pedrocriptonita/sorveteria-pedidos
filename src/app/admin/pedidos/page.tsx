import Link from "next/link";
import {
  getDashboardHoje,
  getHistoricoMensal,
  getPedidosAdmin,
  mesesDisponiveis,
} from "@/features/admin/operacao-data";
import { cancelarPedido } from "@/features/admin/operacao-actions";
import { STATUS_LABEL_CURTO } from "@/features/pedido/status";
import type { StatusPedidoView } from "@/features/pedido/types";
import { formatBRL } from "@/lib/format";

export const dynamic = "force-dynamic";

function dataCurta(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function PedidosAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const meses = mesesDisponiveis();
  const { mes: mesParam } = await searchParams;
  // Só aceita meses dentro da janela permitida (últimos 3); senão usa o atual.
  const mesSelecionado =
    mesParam && meses.some((m) => m.valor === mesParam)
      ? mesParam
      : meses[0].valor;

  const [pedidos, hoje, faturamento] = await Promise.all([
    getPedidosAdmin(),
    getDashboardHoje(),
    getHistoricoMensal(mesSelecionado),
  ]);

  const cardsHoje = [
    { label: "Recebidos", valor: hoje.recebidos, cor: "text-blue-600" },
    { label: "Entregues", valor: hoje.entregues, cor: "text-green-600" },
    { label: "Cancelados", valor: hoje.cancelados, cor: "text-red-600" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Pedidos</h1>

      {/* Dashboard de hoje */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-neutral-500">Hoje</h2>
        <div className="grid grid-cols-3 gap-3">
          {cardsHoje.map((c) => (
            <div
              key={c.label}
              className="flex flex-col items-center gap-1 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
              <span className={`text-3xl font-bold ${c.cor}`}>{c.valor}</span>
              <span className="text-xs text-neutral-500">{c.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Histórico mensal */}
      <section className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-neutral-500">
            Histórico mensal
          </h2>
          <form method="get">
            <select
              name="mes"
              defaultValue={mesSelecionado}
              className="rounded-md border border-neutral-300 bg-transparent px-2 py-1 text-sm dark:border-neutral-700"
            >
              {meses.map((m) => (
                <option key={m.valor} value={m.valor}>
                  {m.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="ml-2 rounded-md border border-neutral-300 px-2 py-1 text-sm transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              Ver
            </button>
          </form>
        </div>
        <div className="flex items-end justify-between rounded-xl border border-neutral-200 bg-gradient-to-br from-green-50 to-white p-4 shadow-sm dark:border-neutral-800 dark:from-green-950 dark:to-neutral-900">
          <div className="flex flex-col">
            <span className="text-xs text-neutral-500">Total vendido</span>
            <span className="text-3xl font-bold text-green-600">
              {formatBRL(faturamento.total)}
            </span>
          </div>
          <span className="text-sm text-neutral-500">
            {faturamento.quantidade} pedido(s)
          </span>
        </div>
      </section>

      <section className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-sm font-semibold text-neutral-500">
          Pedidos recentes
        </h2>
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
                    {STATUS_LABEL_CURTO[p.status as StatusPedidoView] ??
                      p.status}
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
      </section>
    </div>
  );
}
