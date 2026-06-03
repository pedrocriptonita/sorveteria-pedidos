import "server-only";
import type { StatusPagamento } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface ResultadoConciliacao {
  encontrado: boolean;
  atualizado: boolean;
  statusAnterior?: StatusPagamento;
  statusNovo: StatusPagamento;
}

/**
 * Aplica o status vindo do PSP (webhook ou polling) ao Pagamento local,
 * de forma IDEMPOTENTE: se o status já é o mesmo, não faz nada.
 *
 * Se não existir Pagamento com o txid, retorna encontrado=false (na Fase 3
 * ainda não há pedidos; o webhook só precisa receber/validar). A transição de
 * status do PEDIDO e o enfileiramento da comanda entram na Fase 5.
 */
export async function aplicarStatusCobranca(
  txid: string,
  status: StatusPagamento,
): Promise<ResultadoConciliacao> {
  const pagamento = await prisma.pagamento.findUnique({
    where: { pspTxid: txid },
  });

  if (!pagamento) {
    return { encontrado: false, atualizado: false, statusNovo: status };
  }

  if (pagamento.status === status) {
    return {
      encontrado: true,
      atualizado: false,
      statusAnterior: pagamento.status,
      statusNovo: status,
    };
  }

  await prisma.pagamento.update({
    where: { id: pagamento.id },
    data: {
      status,
      confirmadoEm:
        status === "CONFIRMADO" ? new Date() : pagamento.confirmadoEm,
      estornadoEm: status === "ESTORNADO" ? new Date() : pagamento.estornadoEm,
    },
  });

  return {
    encontrado: true,
    atualizado: true,
    statusAnterior: pagamento.status,
    statusNovo: status,
  };
}
