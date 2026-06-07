import "server-only";
import { getProdutosByIds } from "@/features/catalogo/data";
import {
  calcularPreco,
  nomeTamanho,
  resumirOpcoes,
} from "@/features/catalogo/pricing";
import type { CheckoutLinha, ItemRecalculado } from "./types";

export interface ResultadoRecompute {
  itens: ItemRecalculado[];
  subtotal: number;
  erros: string[];
}

/**
 * Recalcula no SERVIDOR o preço de cada linha do carrinho, buscando o produto
 * atual no banco e aplicando o motor de preço puro. Ignora qualquer preço
 * vindo do client (anti-fraude). Valida disponibilidade e configuração.
 */
export async function recomputarItens(
  linhas: CheckoutLinha[],
): Promise<ResultadoRecompute> {
  const itens: ItemRecalculado[] = [];
  const erros: string[] = [];
  let subtotal = 0;

  // Busca todos os produtos do carrinho de uma vez (evita N+1).
  const produtos = await getProdutosByIds(linhas.map((l) => l.produtoId));

  for (const linha of linhas) {
    if (linha.quantidade < 1) {
      erros.push("Quantidade inválida.");
      continue;
    }

    const produto = produtos.get(linha.produtoId);
    if (!produto || !produto.disponivel) {
      erros.push("Um item do carrinho não está mais disponível.");
      continue;
    }

    const { precoUnitario, erros: errosItem } = calcularPreco(
      produto,
      linha.config,
    );
    if (errosItem.length > 0) {
      erros.push(`${produto.nome}: ${errosItem[0]}`);
      continue;
    }

    const precoTotal = precoUnitario * linha.quantidade;
    subtotal += precoTotal;

    itens.push({
      produtoId: produto.id,
      nomeProduto: produto.nome,
      tamanhoNome: nomeTamanho(produto, linha.config),
      opcoesResumo: resumirOpcoes(produto, linha.config),
      quantidade: linha.quantidade,
      precoUnitario,
      precoTotal,
      observacao: linha.observacao?.trim() || null,
    });
  }

  return { itens, subtotal, erros };
}
