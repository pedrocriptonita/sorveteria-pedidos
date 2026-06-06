import "server-only";
import { prisma } from "@/lib/prisma";
import type { OpcaoResumo } from "@/features/catalogo/types";
import type { PedidoHistorico, PedidoView } from "./types";

/** Pedido para a tela de status (serializável). null se não existir. */
export async function getPedidoView(id: string): Promise<PedidoView | null> {
  const pedido = await prisma.pedido.findUnique({
    where: { id },
    include: {
      itens: { orderBy: { createdAt: "asc" } },
      pagamentos: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!pedido) return null;

  // Pagamento PIX mais recente (para QR / copia-e-cola).
  const pix = pedido.pagamentos.find((p) => p.forma === "PIX");

  return {
    id: pedido.id,
    numero: pedido.numero,
    status: pedido.status,
    tipoEntrega: pedido.tipoEntrega,
    formaPagamento: pedido.formaPagamento === "CARTAO" ? "PIX" : pedido.formaPagamento,
    subtotal: Number(pedido.subtotal),
    taxaEntrega: Number(pedido.taxaEntrega),
    total: Number(pedido.total),
    trocoPara: pedido.trocoPara === null ? null : Number(pedido.trocoPara),
    observacao: pedido.observacao,
    enderecoSnapshot: pedido.enderecoSnapshot,
    bairroSnapshot: pedido.bairroSnapshot,
    itens: pedido.itens.map((i) => ({
      id: i.id,
      nome: i.nomeProdutoSnapshot,
      quantidade: i.quantidade,
      tamanho: i.tamanho,
      opcoes: (i.opcoes as OpcaoResumo[] | null) ?? [],
      precoTotal: Number(i.precoTotal),
      observacao: i.observacao,
    })),
    pix: pix
      ? {
          status: pix.status,
          qrCode: pix.pixQrCode,
          copiaCola: pix.pixCopiaCola,
          expiraEm: pix.expiraEm ? pix.expiraEm.toISOString() : null,
        }
      : null,
  };
}

/**
 * Histórico de pedidos de um cliente, identificado pelo telefone (login leve).
 * Retorna os mais recentes (limite) com itens (snapshot) para a aba Pedidos.
 */
export async function getHistoricoCliente(
  telefone: string,
  limit = 20,
): Promise<PedidoHistorico[]> {
  const tel = telefone.replace(/\D/g, "");
  if (!tel) return [];

  const pedidos = await prisma.pedido.findMany({
    where: { cliente: { telefone: tel } },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { itens: { orderBy: { createdAt: "asc" } } },
  });

  return pedidos.map((p) => ({
    id: p.id,
    numero: p.numero,
    status: p.status,
    total: Number(p.total),
    criadoEm: p.createdAt.toISOString(),
    itens: p.itens.map((i) => ({
      nome: i.nomeProdutoSnapshot,
      quantidade: i.quantidade,
      tamanho: i.tamanho,
      opcoes: (i.opcoes as OpcaoResumo[] | null) ?? [],
    })),
  }));
}
