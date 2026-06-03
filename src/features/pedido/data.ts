import "server-only";
import { prisma } from "@/lib/prisma";
import type { OpcaoResumo } from "@/features/catalogo/types";
import type { PedidoView } from "./types";

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
