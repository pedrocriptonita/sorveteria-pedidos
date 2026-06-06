import Link from "next/link";
import { notFound } from "next/navigation";
import { getPedidoView } from "@/features/pedido/data";
import { PixPayment } from "@/features/pedido/components/pix-payment";
import { WhatsappButton } from "@/features/pedido/components/whatsapp-button";
import { STATUS_LABEL_CLIENTE } from "@/features/pedido/status";
import { formatBRL } from "@/lib/format";

export const dynamic = "force-dynamic";

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
        <span className="text-sm text-muted-foreground">
          Pedido #{pedido.numero}
        </span>
        <h1 className="text-2xl font-bold">
          {STATUS_LABEL_CLIENTE[pedido.status]}
        </h1>
        {pedido.status === "CANCELADO" ? (
          <p className="text-sm text-destructive">
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
        <>
          <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-sm text-green-800">
            {pedido.formaPagamento === "DINHEIRO"
              ? `Recebemos seu pedido! Pague ${formatBRL(pedido.total)} em dinheiro na ${
                  pedido.tipoEntrega === "RETIRADA" ? "retirada" : "entrega"
                }.`
              : "Pagamento confirmado! Já estamos preparando seu pedido."}
            {pedido.trocoPara
              ? ` Troco para ${formatBRL(pedido.trocoPara)}.`
              : ""}
          </div>

          <WhatsappButton pedidoId={pedido.id} />
        </>
      ) : null}

      {/* Resumo */}
      <section className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-sm">
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
                <p key={op.grupoNome} className="text-xs text-muted-foreground">
                  {op.grupoNome}: {op.itens.join(", ")}
                </p>
              ))}
            </li>
          ))}
        </ul>

        <div className="mt-2 flex flex-col gap-1 border-t border-border pt-2 text-sm">
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
          <p className="text-xs text-muted-foreground">
            Entrega: {pedido.enderecoSnapshot}
            {pedido.bairroSnapshot ? `, ${pedido.bairroSnapshot}` : ""}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Retirada na loja</p>
        )}
      </section>

      <Link
        href="/"
        className="text-center text-sm text-muted-foreground underline underline-offset-2"
      >
        Voltar ao cardápio
      </Link>
    </div>
  );
}
