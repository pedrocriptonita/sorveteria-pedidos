import "server-only";
import { prisma } from "@/lib/prisma";
import type { CategoriaAdmin, ProdutoAdminFull } from "./types";

/**
 * Catálogo para o admin: todas as categorias e produtos não deletados
 * (incluindo inativos/indisponíveis), ordenados.
 */
export async function getCategoriasComProdutos(): Promise<CategoriaAdmin[]> {
  const categorias = await prisma.categoria.findMany({
    where: { deletedAt: null },
    orderBy: { ordem: "asc" },
    include: {
      subcategorias: {
        where: { deletedAt: null },
        orderBy: { ordem: "asc" },
      },
      produtos: {
        where: { deletedAt: null },
        orderBy: { nome: "asc" },
      },
    },
  });

  return categorias.map((c) => ({
    id: c.id,
    nome: c.nome,
    ordem: c.ordem,
    ativo: c.ativo,
    layout: c.layout,
    subcategorias: c.subcategorias.map((s) => ({
      id: s.id,
      nome: s.nome,
      ordem: s.ordem,
      ativo: s.ativo,
    })),
    produtos: c.produtos.map((p) => ({
      id: p.id,
      nome: p.nome,
      descricao: p.descricao,
      preco: p.preco === null ? null : Number(p.preco),
      montavel: p.montavel,
      disponivel: p.disponivel,
      subcategoriaId: p.subcategoriaId,
    })),
  }));
}

/** Produto completo (com tamanhos/grupos/itens) para o editor. */
export async function getProdutoAdmin(
  id: string,
): Promise<ProdutoAdminFull | null> {
  const p = await prisma.produto.findFirst({
    where: { id, deletedAt: null },
    include: {
      tamanhos: { where: { deletedAt: null }, orderBy: { ordem: "asc" } },
      gruposOpcoes: {
        where: { deletedAt: null },
        orderBy: { ordem: "asc" },
        include: {
          itens: { where: { deletedAt: null }, orderBy: { ordem: "asc" } },
        },
      },
    },
  });
  if (!p) return null;

  const subcategorias = await prisma.subcategoria.findMany({
    where: { categoriaId: p.categoriaId, deletedAt: null },
    orderBy: { ordem: "asc" },
  });

  return {
    id: p.id,
    nome: p.nome,
    descricao: p.descricao,
    foto: p.foto,
    preco: p.preco === null ? null : Number(p.preco),
    montavel: p.montavel,
    disponivel: p.disponivel,
    subcategoriaId: p.subcategoriaId,
    categoriaId: p.categoriaId,
    subcategorias: subcategorias.map((s) => ({
      id: s.id,
      nome: s.nome,
      ordem: s.ordem,
      ativo: s.ativo,
    })),
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
