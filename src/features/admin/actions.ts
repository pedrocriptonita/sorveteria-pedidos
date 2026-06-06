"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { SABORES_ACAI, SABORES_PADRAO } from "./sabores";

/** Normaliza para comparar sabores ignorando acento/caixa/espaços. */
const DIACRITICOS = /[̀-ͯ]/g;
function normalizar(s: string): string {
  return s.trim().toLowerCase().normalize("NFD").replace(DIACRITICOS, "");
}

// ---------------------------------------------------------------------------
// Helpers de parse de FormData
// ---------------------------------------------------------------------------
function str(fd: FormData, k: string): string {
  return String(fd.get(k) ?? "").trim();
}
function numero(fd: FormData, k: string): number {
  return Number(String(fd.get(k) ?? "").replace(",", "."));
}
function numeroOpc(fd: FormData, k: string): number | null {
  const v = str(fd, k);
  return v ? Number(v.replace(",", ".")) : null;
}
function checkbox(fd: FormData, k: string): boolean {
  return fd.get(k) != null;
}

const CATALOGO = "/admin/catalogo";
const revalProduto = (id: string) => revalidatePath(`/admin/produto/${id}`);

// ===========================================================================
// CATEGORIAS
// ===========================================================================
export async function criarCategoria(fd: FormData) {
  await requireAdmin();
  const nome = str(fd, "nome");
  if (!nome) return;
  const ultima = await prisma.categoria.findFirst({
    where: { deletedAt: null },
    orderBy: { ordem: "desc" },
    select: { ordem: true },
  });
  await prisma.categoria.create({
    data: { nome, ordem: (ultima?.ordem ?? 0) + 1 },
  });
  revalidatePath(CATALOGO);
}

export async function renomearCategoria(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const nome = str(fd, "nome");
  if (!id || !nome) return;
  await prisma.categoria.update({ where: { id }, data: { nome } });
  revalidatePath(CATALOGO);
}

export async function toggleCategoriaAtivo(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const cat = await prisma.categoria.findUnique({ where: { id } });
  if (!cat) return;
  await prisma.categoria.update({ where: { id }, data: { ativo: !cat.ativo } });
  revalidatePath(CATALOGO);
}

export async function excluirCategoria(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  if (!id) return;
  await prisma.categoria.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  revalidatePath(CATALOGO);
}

/** Define como os produtos da categoria são exibidos (SCROLL ou GRADE). */
export async function definirLayoutCategoria(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const layout = str(fd, "layout") === "GRADE" ? "GRADE" : "SCROLL";
  if (!id) return;
  await prisma.categoria.update({ where: { id }, data: { layout } });
  revalidatePath(CATALOGO);
}

/** Move a categoria trocando a `ordem` com a vizinha (dir = "cima" | "baixo"). */
export async function moverCategoria(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const dir = str(fd, "dir");
  const lista = await prisma.categoria.findMany({
    where: { deletedAt: null },
    orderBy: { ordem: "asc" },
    select: { id: true, ordem: true },
  });
  const idx = lista.findIndex((c) => c.id === id);
  const alvo = dir === "cima" ? idx - 1 : idx + 1;
  if (idx < 0 || alvo < 0 || alvo >= lista.length) return;

  const a = lista[idx];
  const b = lista[alvo];
  await prisma.$transaction([
    prisma.categoria.update({ where: { id: a.id }, data: { ordem: b.ordem } }),
    prisma.categoria.update({ where: { id: b.id }, data: { ordem: a.ordem } }),
  ]);
  revalidatePath(CATALOGO);
}

// ===========================================================================
// SUBCATEGORIAS
// ===========================================================================
export async function criarSubcategoria(fd: FormData) {
  await requireAdmin();
  const nome = str(fd, "nome");
  const categoriaId = str(fd, "categoriaId");
  if (!nome || !categoriaId) return;
  const ultima = await prisma.subcategoria.findFirst({
    where: { categoriaId, deletedAt: null },
    orderBy: { ordem: "desc" },
    select: { ordem: true },
  });
  await prisma.subcategoria.create({
    data: { nome, categoriaId, ordem: (ultima?.ordem ?? 0) + 1 },
  });
  revalidatePath(CATALOGO);
}

export async function renomearSubcategoria(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const nome = str(fd, "nome");
  if (!id || !nome) return;
  await prisma.subcategoria.update({ where: { id }, data: { nome } });
  revalidatePath(CATALOGO);
}

export async function excluirSubcategoria(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  if (!id) return;
  // Soft delete da subcategoria; produtos perdem o vínculo (voltam a "soltos").
  await prisma.$transaction([
    prisma.produto.updateMany({
      where: { subcategoriaId: id },
      data: { subcategoriaId: null },
    }),
    prisma.subcategoria.update({
      where: { id },
      data: { deletedAt: new Date(), ativo: false },
    }),
  ]);
  revalidatePath(CATALOGO);
}

// ===========================================================================
// PRODUTOS
// ===========================================================================
export async function criarProduto(fd: FormData) {
  await requireAdmin();
  const nome = str(fd, "nome");
  const categoriaId = str(fd, "categoriaId");
  if (!nome || !categoriaId) return;
  const montavel = checkbox(fd, "montavel");
  const subcategoriaId = str(fd, "subcategoriaId") || null;

  const produto = await prisma.produto.create({
    data: {
      nome,
      categoriaId,
      subcategoriaId,
      montavel,
      descricao: str(fd, "descricao") || null,
      preco: montavel ? null : numeroOpc(fd, "preco"),
    },
  });
  revalidatePath(CATALOGO);
  // Montável precisa de tamanhos/opções → leva direto ao editor.
  if (montavel) redirect(`/admin/produto/${produto.id}`);
}

export async function editarProduto(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  if (!id) return;
  const produto = await prisma.produto.findUnique({ where: { id } });
  if (!produto) return;
  await prisma.produto.update({
    where: { id },
    data: {
      nome: str(fd, "nome") || produto.nome,
      descricao: str(fd, "descricao") || null,
      preco: produto.montavel ? null : numeroOpc(fd, "preco"),
      subcategoriaId: str(fd, "subcategoriaId") || null,
    },
  });
  revalidatePath(CATALOGO);
  revalProduto(id);
}

export async function toggleProdutoDisponivel(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const p = await prisma.produto.findUnique({ where: { id } });
  if (!p) return;
  await prisma.produto.update({
    where: { id },
    data: { disponivel: !p.disponivel },
  });
  revalidatePath(CATALOGO);
  revalProduto(id);
}

export async function excluirProduto(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  if (!id) return;
  await prisma.produto.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  revalidatePath(CATALOGO);
  // Volta ao catálogo: se a exclusão veio do editor do produto, a própria
  // URL /admin/produto/[id] passaria a dar 404 (produto soft-deletado).
  redirect(CATALOGO);
}

// ===========================================================================
// TAMANHOS (montável)
// ===========================================================================
export async function criarTamanho(fd: FormData) {
  await requireAdmin();
  const produtoId = str(fd, "produtoId");
  const nome = str(fd, "nome");
  const precoBase = numero(fd, "precoBase");
  if (!produtoId || !nome || Number.isNaN(precoBase)) return;
  const qtd = await prisma.tamanho.count({
    where: { produtoId, deletedAt: null },
  });
  await prisma.tamanho.create({
    data: { produtoId, nome, precoBase, ordem: qtd + 1 },
  });
  revalProduto(produtoId);
}

export async function editarTamanho(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const produtoId = str(fd, "produtoId");
  if (!id) return;
  await prisma.tamanho.update({
    where: { id },
    data: { nome: str(fd, "nome"), precoBase: numero(fd, "precoBase") },
  });
  revalProduto(produtoId);
}

export async function excluirTamanho(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const produtoId = str(fd, "produtoId");
  if (!id) return;
  await prisma.tamanho.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  revalProduto(produtoId);
}

// ===========================================================================
// GRUPOS DE OPÇÕES (montável)
// ===========================================================================
export async function criarGrupo(fd: FormData) {
  await requireAdmin();
  const produtoId = str(fd, "produtoId");
  const nome = str(fd, "nome");
  if (!produtoId || !nome) return;
  const qtd = await prisma.grupoOpcao.count({
    where: { produtoId, deletedAt: null },
  });
  await prisma.grupoOpcao.create({
    data: {
      produtoId,
      nome,
      tipo: str(fd, "tipo") === "UNICO" ? "UNICO" : "MULTIPLO",
      min: Math.max(0, numero(fd, "min") || 0),
      max: numeroOpc(fd, "max"),
      cotaGratis: Math.max(0, numero(fd, "cotaGratis") || 0),
      obrigatorio: checkbox(fd, "obrigatorio"),
      ordem: qtd + 1,
    },
  });
  revalProduto(produtoId);
}

export async function editarGrupo(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const produtoId = str(fd, "produtoId");
  if (!id) return;
  await prisma.grupoOpcao.update({
    where: { id },
    data: {
      nome: str(fd, "nome"),
      tipo: str(fd, "tipo") === "UNICO" ? "UNICO" : "MULTIPLO",
      min: Math.max(0, numero(fd, "min") || 0),
      max: numeroOpc(fd, "max"),
      cotaGratis: Math.max(0, numero(fd, "cotaGratis") || 0),
      obrigatorio: checkbox(fd, "obrigatorio"),
    },
  });
  revalProduto(produtoId);
}

export async function excluirGrupo(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const produtoId = str(fd, "produtoId");
  if (!id) return;
  await prisma.grupoOpcao.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  revalProduto(produtoId);
}

// ===========================================================================
// ITENS DE OPÇÃO (montável)
// ===========================================================================
export async function criarItem(fd: FormData) {
  await requireAdmin();
  const grupoId = str(fd, "grupoId");
  const produtoId = str(fd, "produtoId");
  const nome = str(fd, "nome");
  if (!grupoId || !nome) return;
  const qtd = await prisma.itemOpcao.count({
    where: { grupoId, deletedAt: null },
  });
  await prisma.itemOpcao.create({
    data: {
      grupoId,
      nome,
      precoExtra: numero(fd, "precoExtra") || 0,
      ordem: qtd + 1,
    },
  });
  revalProduto(produtoId);
}

/**
 * Preenche o grupo com uma lista de sabores de uma vez, pulando os que já
 * existem no grupo (comparação sem acento/caixa) para nunca duplicar.
 * precoExtra = 0; o admin ajusta sobrepreço depois via `editarItem`.
 */
async function preencherComSabores(
  fd: FormData,
  sabores: readonly string[],
) {
  await requireAdmin();
  const grupoId = str(fd, "grupoId");
  const produtoId = str(fd, "produtoId");
  if (!grupoId) return;

  const existentes = await prisma.itemOpcao.findMany({
    where: { grupoId, deletedAt: null },
    select: { nome: true },
  });
  const jaTem = new Set(existentes.map((i) => normalizar(i.nome)));
  const qtd = existentes.length;

  const novos = sabores
    .filter((s) => !jaTem.has(normalizar(s)))
    .map((nome, idx) => ({ grupoId, nome, precoExtra: 0, ordem: qtd + idx + 1 }));
  if (novos.length === 0) return;

  await prisma.itemOpcao.createMany({ data: novos });
  revalProduto(produtoId);
}

/** Preenche o grupo com os sabores padrão de sorvete. */
export async function preencherSabores(fd: FormData) {
  await preencherComSabores(fd, SABORES_PADRAO);
}

/** Preenche o grupo com os sabores/linhas padrão de açaí. */
export async function preencherSaboresAcai(fd: FormData) {
  await preencherComSabores(fd, SABORES_ACAI);
}

/** Edita nome e sobrepreço de um item já existente (ex.: Pistache + R$2,00). */
export async function editarItem(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const produtoId = str(fd, "produtoId");
  const nome = str(fd, "nome");
  if (!id || !nome) return;
  await prisma.itemOpcao.update({
    where: { id },
    data: { nome, precoExtra: numero(fd, "precoExtra") || 0 },
  });
  revalProduto(produtoId);
}

export async function toggleItemDisponivel(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const produtoId = str(fd, "produtoId");
  const item = await prisma.itemOpcao.findUnique({ where: { id } });
  if (!item) return;
  await prisma.itemOpcao.update({
    where: { id },
    data: { disponivel: !item.disponivel },
  });
  revalProduto(produtoId);
}

export async function excluirItem(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const produtoId = str(fd, "produtoId");
  if (!id) return;
  await prisma.itemOpcao.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  revalProduto(produtoId);
}
