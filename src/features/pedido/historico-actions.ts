"use server";

import { prisma } from "@/lib/prisma";
import { getProdutosByIds } from "@/features/catalogo/data";
import {
  calcularPreco,
  nomeTamanho,
  resumirOpcoes,
} from "@/features/catalogo/pricing";
import type { CartItem, SelecaoConfig } from "@/features/catalogo/types";
import { getHistoricoCliente } from "./data";
import type { PedidoHistorico } from "./types";

/** Busca o histórico de pedidos do cliente pelo telefone (login leve). */
export async function buscarHistorico(
  telefone: string,
): Promise<PedidoHistorico[]> {
  const tel = telefone.replace(/\D/g, "");
  if (tel.length < 8) return [];
  return getHistoricoCliente(tel);
}

export type LinhaCarrinho = Omit<CartItem, "linhaId">;

export interface ResultadoRepetir {
  itens: LinhaCarrinho[];
  avisos: string[];
}

/**
 * Reconstrói (best-effort) os itens de um pedido antigo para re-adicionar ao
 * carrinho. Como não guardamos a config crua (ids), casamos os NOMES salvos no
 * snapshot com o catálogo atual. Itens cujo produto/opção não existem mais (ou
 * que ficaram inválidos) são omitidos e reportados em `avisos`.
 */
export async function repetirPedido(
  pedidoId: string,
): Promise<ResultadoRepetir> {
  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    include: { itens: { orderBy: { createdAt: "asc" } } },
  });

  const itens: LinhaCarrinho[] = [];
  const avisos: string[] = [];
  if (!pedido) return { itens, avisos: ["Pedido não encontrado."] };

  // Busca todos os produtos do pedido de uma vez (evita N+1).
  const produtosDoPedido = await getProdutosByIds(
    pedido.itens.flatMap((i) => (i.produtoId ? [i.produtoId] : [])),
  );

  for (const item of pedido.itens) {
    const nome = item.nomeProdutoSnapshot;

    if (!item.produtoId) {
      avisos.push(`${nome}: indisponível.`);
      continue;
    }
    const produto = produtosDoPedido.get(item.produtoId);
    if (!produto || !produto.disponivel) {
      avisos.push(`${nome}: não está mais disponível.`);
      continue;
    }

    // Reconstrói a config a partir dos snapshots (nomes → ids atuais).
    const tamanhoId =
      (item.tamanho
        ? produto.tamanhos.find((t) => t.nome === item.tamanho)?.id
        : null) ??
      produto.tamanhos[0]?.id ??
      null;

    const opcoesSnapshot =
      (item.opcoes as Array<{ grupoNome: string; itens: string[] }> | null) ??
      [];
    const selecoes: SelecaoConfig["selecoes"] = {};
    for (const op of opcoesSnapshot) {
      const grupo = produto.grupos.find((g) => g.nome === op.grupoNome);
      if (!grupo) continue;
      const ids = op.itens
        .map((n) => grupo.itens.find((gi) => gi.nome === n && gi.disponivel)?.id)
        .filter((id): id is string => Boolean(id));
      if (ids.length > 0) selecoes[grupo.id] = ids;
    }

    const config: SelecaoConfig = { tamanhoId, selecoes };
    const { precoUnitario, erros } = calcularPreco(produto, config);
    if (erros.length > 0) {
      avisos.push(`${nome}: ${erros[0]}`);
      continue;
    }

    itens.push({
      produtoId: produto.id,
      nomeProduto: produto.nome,
      montavel: produto.montavel,
      tamanhoNome: nomeTamanho(produto, config),
      opcoesResumo: resumirOpcoes(produto, config),
      quantidade: item.quantidade,
      precoUnitario,
      config,
    });
  }

  return { itens, avisos };
}
