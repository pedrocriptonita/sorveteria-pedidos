import { avancarStatusAction, reimprimirAction } from "../actions";
import { proximoPasso } from "../status";
import type { PedidoCozinha } from "../types";
import { formatBRL } from "@/lib/format";

function formatEspera(min: number): string {
  if (min < 1) return "agora";
  if (min === 1) return "há 1 min";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  return `há ${h}h${String(min % 60).padStart(2, "0")}`;
}

export function PedidoCozinhaCard({ pedido }: { pedido: PedidoCozinha }) {
  const passo = proximoPasso(pedido.status, pedido.tipoEntrega);
  const atrasado = pedido.esperaMin > 20;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-neutral-200 bg-background p-3 shadow-sm dark:border-neutral-800">
      <div className="flex items-center justify-between">
        <span className="font-bold">#{pedido.numero}</span>
        <span
          className={`text-xs ${atrasado ? "font-semibold text-red-600" : "text-neutral-500"}`}
        >
          {formatEspera(pedido.esperaMin)}
        </span>
      </div>

      <div className="flex flex-wrap gap-1 text-xs">
        <span className="rounded bg-neutral-100 px-1.5 py-0.5 dark:bg-neutral-800">
          {pedido.tipoEntrega === "DELIVERY" ? "🛵 Entrega" : "🏪 Retirada"}
        </span>
        <span className="rounded bg-neutral-100 px-1.5 py-0.5 dark:bg-neutral-800">
          {pedido.formaPagamento === "DINHEIRO"
            ? `💵 ${formatBRL(pedido.total)}`
            : "PIX pago"}
        </span>
      </div>

      <ul className="flex flex-col gap-1 text-sm">
        {pedido.itens.map((item, idx) => (
          <li key={idx}>
            <span className="font-medium">
              {item.quantidade}× {item.nome}
              {item.tamanho ? ` (${item.tamanho})` : ""}
            </span>
            {item.opcoes.map((op) => (
              <p key={op.grupoNome} className="text-xs text-neutral-500">
                {op.grupoNome}: {op.itens.join(", ")}
              </p>
            ))}
            {item.observacao ? (
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Obs: {item.observacao}
              </p>
            ) : null}
          </li>
        ))}
      </ul>

      {pedido.observacao ? (
        <p className="rounded bg-amber-50 px-2 py-1 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          Obs: {pedido.observacao}
        </p>
      ) : null}

      {pedido.tipoEntrega === "DELIVERY" && pedido.enderecoSnapshot ? (
        <p className="text-xs text-neutral-500">
          {pedido.enderecoSnapshot}
          {pedido.bairroSnapshot ? `, ${pedido.bairroSnapshot}` : ""}
        </p>
      ) : null}

      <div className="mt-1 flex items-center gap-2">
        {passo ? (
          <form action={avancarStatusAction} className="flex-1">
            <input type="hidden" name="pedidoId" value={pedido.id} />
            <button
              type="submit"
              className="w-full rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              {passo.label}
            </button>
          </form>
        ) : null}

        <form action={reimprimirAction}>
          <input type="hidden" name="pedidoId" value={pedido.id} />
          <button
            type="submit"
            title="Reimprimir comanda"
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            🖨️
          </button>
        </form>
      </div>
    </div>
  );
}
