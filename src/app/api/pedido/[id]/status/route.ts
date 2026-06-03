import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sincronizarCobranca } from "@/features/pedido/pagamento";

export const dynamic = "force-dynamic";

/**
 * Status do pedido para polling do client. Se for PIX ainda aguardando, faz uma
 * checagem AO VIVO no PSP (também serve de backup do webhook e permite confirmar
 * em ambiente local, sem URL pública). Acesso por id (URL-capability).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const pedido = await prisma.pedido.findUnique({
    where: { id },
    include: { pagamentos: { where: { forma: "PIX" }, take: 1 } },
  });
  if (!pedido) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }

  const pix = pedido.pagamentos[0];
  if (
    pedido.status === "AGUARDANDO_PAGAMENTO" &&
    pix?.pspTxid &&
    pix.status === "AGUARDANDO"
  ) {
    try {
      await sincronizarCobranca(pix.pspTxid);
    } catch {
      // Falha de rede com o PSP não deve quebrar o polling do client.
    }
  }

  const atual = await prisma.pedido.findUnique({
    where: { id },
    select: { status: true },
  });

  return NextResponse.json({
    status: atual?.status ?? pedido.status,
    pago: atual?.status !== "AGUARDANDO_PAGAMENTO" && atual?.status !== "CANCELADO",
  });
}
