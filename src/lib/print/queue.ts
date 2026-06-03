import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ComandaPayload, PrintJobDTO } from "./types";

/** Após este nº de falhas, o job vira ERRO (deixa de ser reentregue). */
export const MAX_TENTATIVAS = 5;

/** Cria um job de impressão PENDENTE para um pedido. */
export async function enfileirarImpressao(
  pedidoId: string,
  conteudo: ComandaPayload,
) {
  return prisma.filaImpressao.create({
    data: {
      pedidoId,
      conteudo: conteudo as unknown as Prisma.InputJsonValue,
    },
  });
}

/** Jobs aguardando impressão (FIFO), para o agente buscar. */
export async function buscarJobsPendentes(limit = 20): Promise<PrintJobDTO[]> {
  const jobs = await prisma.filaImpressao.findMany({
    where: { status: "PENDENTE" },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  return jobs.map((j) => ({
    id: j.id,
    pedidoId: j.pedidoId,
    tentativas: j.tentativas,
    criadoEm: j.createdAt.toISOString(),
    conteudo: (j.conteudo as ComandaPayload | null) ?? null,
  }));
}

/** Marca um job como impresso com sucesso. Retorna null se não existir. */
export async function marcarImpresso(id: string) {
  const job = await prisma.filaImpressao.findUnique({ where: { id } });
  if (!job) return null;

  const atualizado = await prisma.filaImpressao.update({
    where: { id },
    data: { status: "IMPRESSO", impressoEm: new Date() },
  });

  // Comanda saiu na cozinha → avança o pedido NA_FILA → IMPRESSO (idempotente).
  await prisma.pedido.updateMany({
    where: { id: job.pedidoId, status: "NA_FILA" },
    data: { status: "IMPRESSO" },
  });

  return atualizado;
}

/**
 * Registra falha de impressão: incrementa tentativas e guarda o erro. Mantém
 * o job PENDENTE para retry; só vira ERRO após MAX_TENTATIVAS.
 */
export async function marcarErro(id: string, erro: string) {
  const job = await prisma.filaImpressao.findUnique({ where: { id } });
  if (!job) return null;

  const tentativas = job.tentativas + 1;
  return prisma.filaImpressao.update({
    where: { id },
    data: {
      tentativas,
      ultimoErro: erro,
      status: tentativas >= MAX_TENTATIVAS ? "ERRO" : "PENDENTE",
    },
  });
}
