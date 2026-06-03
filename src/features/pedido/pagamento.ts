import "server-only";
import type { StatusPagamento } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPsp } from "@/lib/psp";
import { aplicarStatusCobranca } from "@/lib/psp/reconcile";
import { enfileirarImpressao } from "@/lib/print/queue";
import { comandaDePedido } from "./comanda";

/**
 * Quando uma cobrança PIX é CONFIRMADA, leva o pedido de AGUARDANDO_PAGAMENTO
 * para NA_FILA e enfileira a comanda. Idempotente: só age se o pedido ainda
 * estiver aguardando (webhook e polling podem chamar em paralelo).
 */
async function confirmarPedidoPorTxid(txid: string): Promise<void> {
  const pagamento = await prisma.pagamento.findUnique({
    where: { pspTxid: txid },
    include: { pedido: { include: { itens: true } } },
  });
  if (!pagamento) return;

  const { pedido } = pagamento;
  if (pedido.status !== "AGUARDANDO_PAGAMENTO") return; // já processado

  await prisma.pedido.update({
    where: { id: pedido.id },
    data: { status: "NA_FILA" },
  });
  await enfileirarImpressao(pedido.id, comandaDePedido(pedido));
}

/**
 * Aplica o status de uma cobrança (vindo de webhook OU polling) ao Pagamento e,
 * se confirmado, dispara a transição do pedido + impressão.
 */
export async function aplicarEventoPagamento(
  txid: string,
  status: StatusPagamento,
) {
  const resultado = await aplicarStatusCobranca(txid, status);
  if (resultado.encontrado && status === "CONFIRMADO") {
    await confirmarPedidoPorTxid(txid);
  }
  return resultado;
}

/** Consulta o status atual no PSP e aplica (usado no polling e no status page). */
export async function sincronizarCobranca(txid: string) {
  const cobranca = await getPsp().consultarCobranca(txid);
  return aplicarEventoPagamento(txid, cobranca.status);
}

export interface ResultadoPolling {
  verificados: number;
  atualizados: number;
}

/**
 * Backup do webhook: varre os pagamentos PIX ainda AGUARDANDO e concilia.
 */
export async function reconciliarPendentes(): Promise<ResultadoPolling> {
  const pendentes = await prisma.pagamento.findMany({
    where: { forma: "PIX", status: "AGUARDANDO", pspTxid: { not: null } },
    select: { pspTxid: true },
  });

  let atualizados = 0;
  for (const { pspTxid } of pendentes) {
    if (!pspTxid) continue;
    try {
      const r = await sincronizarCobranca(pspTxid);
      if (r.atualizado) atualizados++;
    } catch (err) {
      console.error(`Polling falhou para ${pspTxid}:`, (err as Error).message);
    }
  }
  return { verificados: pendentes.length, atualizados };
}
