import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CategoriaView, ProdutoView } from "./types";

/**
 * Camada de leitura do cardápio público. Filtra o que está ativo/disponível e
 * não foi soft-deletado, e serializa Decimal → number para os Client Components.
 */

// Include reaproveitado: produto com tamanhos + grupos + itens, tudo ordenado
// e sem registros deletados.
const produtoInclude = {
  tamanhos: {
    where: { deletedAt: null },
    orderBy: { ordem: "asc" },
  },
  gruposOpcoes: {
    where: { deletedAt: null },
    orderBy: { ordem: "asc" },
    include: {
      itens: {
        where: { deletedAt: null },
        orderBy: { ordem: "asc" },
      },
    },
  },
} satisfies Prisma.ProdutoInclude;

type ProdutoComRelacoes = Prisma.ProdutoGetPayload<{
  include: typeof produtoInclude;
}>;

function mapProduto(p: ProdutoComRelacoes): ProdutoView {
  return {
    id: p.id,
    nome: p.nome,
    descricao: p.descricao,
    foto: p.foto,
    preco: p.preco === null ? null : Number(p.preco),
    montavel: p.montavel,
    disponivel: p.disponivel,
    tamanhos: p.tamanhos.map((t) => ({
      id: t.id,
      nome: t.nome,
      precoBase: Number(t.precoBase),
    })),
    grupos: p.gruposOpcoes.map((g) => ({
      id: g.id,
      nome: g.nome,
      tipo: g.tipo,
      min: g.min,
      max: g.max,
      cotaGratis: g.cotaGratis,
      obrigatorio: g.obrigatorio,
      itens: g.itens.map((it) => ({
        id: it.id,
        nome: it.nome,
        precoExtra: Number(it.precoExtra),
        disponivel: it.disponivel,
      })),
    })),
  };
}

/** Cardápio completo: categorias ativas com seus produtos disponíveis. */
export async function getCardapio(): Promise<CategoriaView[]> {
  const categorias = await prisma.categoria.findMany({
    where: { ativo: true, deletedAt: null },
    orderBy: { ordem: "asc" },
    include: {
      produtos: {
        where: { deletedAt: null },
        orderBy: { nome: "asc" },
        include: produtoInclude,
      },
    },
  });

  return categorias
    .map((c) => ({
      id: c.id,
      nome: c.nome,
      produtos: c.produtos.map(mapProduto),
    }))
    .filter((c) => c.produtos.length > 0);
}

/** Um produto pelo id (para a tela de montagem). null se inexistente/deletado. */
export async function getProduto(id: string): Promise<ProdutoView | null> {
  const produto = await prisma.produto.findFirst({
    where: { id, deletedAt: null },
    include: produtoInclude,
  });
  return produto ? mapProduto(produto) : null;
}
