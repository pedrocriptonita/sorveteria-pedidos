"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { getPsp } from "@/lib/psp";

function str(fd: FormData, k: string): string {
  return String(fd.get(k) ?? "").trim();
}

const TERMINAIS = ["ENTREGUE", "CANCELADO"];

/**
 * Cancela um pedido. Para PIX:
 *  - já pago (CONFIRMADO) → estorno TOTAL no PSP; só cancela se o estorno
 *    suceder (não deixa o pedido cancelado sem devolver o dinheiro);
 *  - ainda aguardando → tenta cancelar a cobrança no PSP (best-effort).
 * Dinheiro é só marcado como cancelado.
 */
export async function cancelarPedido(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  if (!id) return;

  const pedido = await prisma.pedido.findUnique({
    where: { id },
    include: { pagamentos: true },
  });
  if (!pedido || TERMINAIS.includes(pedido.status)) return;

  const pix = pedido.pagamentos.find((p) => p.forma === "PIX" && p.pspTxid);

  if (pix?.pspTxid) {
    if (pix.status === "CONFIRMADO") {
      try {
        await getPsp().estornar(pix.pspTxid);
      } catch (err) {
        // Estorno falhou: aborta o cancelamento para não perder a referência.
        console.error("Estorno PIX falhou:", (err as Error).message);
        return;
      }
      await prisma.pagamento.update({
        where: { id: pix.id },
        data: { status: "ESTORNADO", estornadoEm: new Date() },
      });
    } else if (pix.status === "AGUARDANDO") {
      try {
        await getPsp().cancelarCobranca(pix.pspTxid);
      } catch (err) {
        console.error("Cancelamento da cobrança falhou:", (err as Error).message);
      }
      await prisma.pagamento.update({
        where: { id: pix.id },
        data: { status: "CANCELADO" },
      });
    }
  }

  await prisma.pedido.update({
    where: { id },
    data: { status: "CANCELADO" },
  });
  revalidatePath("/admin/pedidos");
}

/** Bloqueia/desbloqueia um cliente (anti-trote do fluxo Dinheiro). */
export async function toggleClienteBloqueado(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const cliente = await prisma.cliente.findUnique({ where: { id } });
  if (!cliente) return;
  await prisma.cliente.update({
    where: { id },
    data: { bloqueado: !cliente.bloqueado },
  });
  revalidatePath("/admin/clientes");
}
