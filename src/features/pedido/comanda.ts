import "server-only";
import type { Pedido, ItemPedido } from "@prisma/client";
import type { ComandaPayload } from "@/lib/print/types";
import type { OpcaoResumo } from "@/features/catalogo/types";
import type { ItemRecalculado } from "./types";

/** Junta tamanho + opções num texto curto para a comanda. */
function detalhe(tamanho: string | null, opcoes: OpcaoResumo[]): string {
  const partes: string[] = [];
  if (tamanho) partes.push(tamanho);
  for (const op of opcoes) partes.push(`${op.grupoNome}: ${op.itens.join(", ")}`);
  return partes.join(" · ");
}

/** Constrói a comanda a partir dos itens recalculados (no momento da criação). */
export function comandaDeItens(
  numeroPedido: number,
  tipoEntrega: "RETIRADA" | "DELIVERY",
  itens: ItemRecalculado[],
  total: number,
  observacao?: string,
): ComandaPayload {
  return {
    numeroPedido,
    tipoEntrega,
    itens: itens.map((i) => ({
      nome: i.nomeProduto,
      quantidade: i.quantidade,
      observacao:
        [detalhe(i.tamanhoNome, i.opcoesResumo), i.observacao]
          .filter(Boolean)
          .join(" · ") || undefined,
    })),
    observacao,
    total,
    criadoEm: new Date().toISOString(),
  };
}

/** Constrói a comanda a partir de um Pedido já persistido (confirmação PIX). */
export function comandaDePedido(
  pedido: Pedido & { itens: ItemPedido[] },
): ComandaPayload {
  return {
    numeroPedido: pedido.numero,
    tipoEntrega: pedido.tipoEntrega,
    itens: pedido.itens.map((i) => {
      const opcoes = (i.opcoes as OpcaoResumo[] | null) ?? [];
      return {
        nome: i.nomeProdutoSnapshot,
        quantidade: i.quantidade,
        observacao:
          detalhe(i.tamanho, opcoes) ||
          (i.observacao ? i.observacao : undefined) ||
          undefined,
      };
    }),
    observacao: pedido.observacao ?? undefined,
    total: Number(pedido.total),
    criadoEm: pedido.createdAt.toISOString(),
  };
}
