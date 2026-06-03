"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCozinha } from "@/lib/auth/session";
import { enfileirarImpressao } from "@/lib/print/queue";
import { comandaDePedido } from "@/features/pedido/comanda";
import { proximoPasso } from "./status";

/**
 * Avança o pedido para o próximo status do fluxo da cozinha. Idempotente: só
 * atualiza se o pedido ainda estiver no status esperado (evita pular etapa em
 * cliques duplos / múltiplas telas). Ao ENTREGAR um pedido em dinheiro, confirma
 * o pagamento (dinheiro recebido na entrega/retirada).
 */
export async function avancarStatusAction(formData: FormData) {
  await requireCozinha();
  const pedidoId = String(formData.get("pedidoId") ?? "");
  if (!pedidoId) return;

  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    select: { status: true, tipoEntrega: true },
  });
  if (!pedido) return;

  const passo = proximoPasso(pedido.status, pedido.tipoEntrega);
  if (!passo) return;

  await prisma.pedido.updateMany({
    where: { id: pedidoId, status: pedido.status },
    data: { status: passo.proximo },
  });

  if (passo.proximo === "ENTREGUE") {
    await prisma.pagamento.updateMany({
      where: { pedidoId, forma: "DINHEIRO", status: "AGUARDANDO" },
      data: { status: "CONFIRMADO", confirmadoEm: new Date() },
    });
  }

  revalidatePath("/cozinha");
}

/** Gera um NOVO job de impressão para o pedido (reimpressão da comanda). */
export async function reimprimirAction(formData: FormData) {
  await requireCozinha();
  const pedidoId = String(formData.get("pedidoId") ?? "");
  if (!pedidoId) return;

  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    include: { itens: true },
  });
  if (!pedido) return;

  await enfileirarImpressao(pedido.id, comandaDePedido(pedido));
  revalidatePath("/cozinha");
}
