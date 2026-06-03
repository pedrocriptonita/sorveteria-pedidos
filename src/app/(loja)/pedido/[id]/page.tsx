import Link from "next/link";
import { notFound } from "next/navigation";
import { getPedidoView } from "@/features/pedido/data";
import { PixPayment } from "@/features/pedido/components/pix-payment";
import type { StatusPedidoView } from "@/features/pedido/types";
import { formatBRL } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<StatusPedidoView, string> = {
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  PAGO: "Pagamento confirmado",
  NA_FILA: "Pedido confirmado — na fila",
  IMPRESSO: "Em preparo",
  EM_PREPARO: "Em preparo",
  PRONTO: "Pronto!",
  SAIU_PARA_ENTREGA: "Saiu para entrega",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
};

export default async function PedidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pedido = await getPedidoView(id);
  if (!pedido) notFound();

  const aguardandoPix =
    pedido.status === "AGUARDANDO_PAGAMENTO" && pedido.pix !== null;
  const confirmado = !["AGUARDANDO_PAGAMENTO", "CANCELADO"].includes(
    pedido.status,
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <span className="text-sm text-neutral-500">Pedido #{pedido.numero}</span>
        <h1 className="text-2xl font-bold">{STATUS_LABEL[pedido.status]}</h1>
        {pedido.status === "CANCELADO" ? (
          <p className="text-sm text-red-600">
            Este pedido foi cancelado. Se precisar, faça um novo.
          </p>
        ) : null}
      </header>

      {aguardandoPix ? (
        <PixPayment
          pedidoId={pedido.id}
          qrCode={pedido.pix!.qrCode}
          copiaCola={pedido.pix!.copiaCola}
        />
      ) : null}

      {confirmado ? (
        <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
          {pedido.formaPagamento === "DINHEIRO"
            ? `Recebemos seu pedido! Pague ${formatBRL(pedido.total)} em dinheiro na ${
                pedido.tipoEntrega === "RETIRADA" ? "retirada" : "entrega"
              }.`
            : "Pagamento confirmado! Já estamos preparando seu pedido."}
          {pedido.trocoPara
            ? ` Troco para ${formatBRL(pedido.trocoPara)}.`
            : ""}
        </div>
      ) : null}

      {/* Resumo */}
      <section className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="font-semibold">Resumo</h2>
        <ul className="flex flex-col gap-2">
          {pedido.itens.map((item) => (
            <li key={item.id} className="text-sm">
              <div className="flex justify-between">
                <span>
                  {item.quantidade}× {item.nome}
                  {item.tamanho ? ` (${item.tamanho})` : ""}
                </span>
                <span>{formatBRL(item.precoTotal)}</span>
              </div>
              {item.opcoes.map((op) => (
                <p key={op.grupoNome} className="text-xs text-neutral-500">
                  {op.grupoNome}: {op.itens.join(", ")}
                </p>
              ))}
            </li>
          ))}
        </ul>

        <div className="mt-2 flex flex-col gap-1 border-t border-neutral-200 pt-2 text-sm dark:border-neutral-800">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatBRL(pedido.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Taxa de entrega</span>
            <span>{formatBRL(pedido.taxaEntrega)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>{formatBRL(pedido.total)}</span>
          </div>
        </div>

        {pedido.tipoEntrega === "DELIVERY" && pedido.enderecoSnapshot ? (
          <p className="text-xs text-neutral-500">
            Entrega: {pedido.enderecoSnapshot}
            {pedido.bairroSnapshot ? `, ${pedido.bairroSnapshot}` : ""}
          </p>
        ) : (
          <p className="text-xs text-neutral-500">Retirada na loja</p>
        )}
      </section>

      <Link
        href="/"
        className="text-center text-sm text-neutral-500 underline underline-offset-2"
      >
        Voltar ao cardápio
      </Link>
    </div>
  );
}
