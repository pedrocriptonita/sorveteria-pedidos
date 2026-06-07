/**
 * Popula o cardápio com dados de exemplo (idempotente — IDs fixos, recria do
 * zero a cada execução). Útil para desenvolver/testar a vitrine da Fase 4.
 *
 * Uso: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// IDs fixos para idempotência.
const CAT_ACAI = "11111111-1111-1111-1111-111111111111";
const CAT_BEBIDAS = "22222222-2222-2222-2222-222222222222";
const PROD_ACAI = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

async function main() {
  // Limpa o catálogo semeado (cascade remove tamanhos/grupos/itens dos produtos).
  await prisma.produto.deleteMany({
    where: { categoriaId: { in: [CAT_ACAI, CAT_BEBIDAS] } },
  });
  await prisma.categoria.deleteMany({
    where: { id: { in: [CAT_ACAI, CAT_BEBIDAS] } },
  });

  // Categorias.
  await prisma.categoria.createMany({
    data: [
      { id: CAT_ACAI, nome: "Açaí", ordem: 1 },
      { id: CAT_BEBIDAS, nome: "Bebidas", ordem: 2 },
    ],
  });

  // Açaí montável: tamanhos + 3 grupos (UNICO obrigatório, cota grátis, sempre cobrado).
  await prisma.produto.create({
    data: {
      id: PROD_ACAI,
      nome: "Monte seu Açaí",
      descricao: "Escolha o tamanho, o creme, os acompanhamentos e os adicionais.",
      montavel: true,
      categoriaId: CAT_ACAI,
      tamanhos: {
        create: [
          { nome: "300ml", precoBase: 15, ordem: 1 },
          { nome: "500ml", precoBase: 20, ordem: 2 },
          { nome: "700ml", precoBase: 25, ordem: 3 },
        ],
      },
      gruposOpcoes: {
        create: [
          {
            nome: "Creme",
            tipo: "UNICO",
            obrigatorio: true,
            min: 1,
            max: 1,
            cotaGratis: 0,
            ordem: 1,
            itens: {
              create: [
                { nome: "Tradicional", precoExtra: 0, ordem: 1 },
                { nome: "Cupuaçu", precoExtra: 2, ordem: 2 },
                { nome: "Morango", precoExtra: 2, ordem: 3 },
              ],
            },
          },
          {
            nome: "Acompanhamentos",
            tipo: "MULTIPLO",
            min: 0,
            max: 5,
            cotaGratis: 3,
            ordem: 2,
            itens: {
              create: [
                { nome: "Granola", precoExtra: 0, ordem: 1 },
                { nome: "Banana", precoExtra: 0, ordem: 2 },
                { nome: "Leite condensado", precoExtra: 0, ordem: 3 },
                { nome: "Paçoca", precoExtra: 2, ordem: 4 },
                { nome: "Morango", precoExtra: 2, ordem: 5 },
                { nome: "Kiwi", precoExtra: 3, ordem: 6 },
              ],
            },
          },
          {
            nome: "Adicionais",
            tipo: "MULTIPLO",
            min: 0,
            max: 3,
            cotaGratis: 0,
            ordem: 3,
            itens: {
              create: [
                { nome: "Nutella", precoExtra: 5, ordem: 1 },
                { nome: "Leite Ninho", precoExtra: 4, ordem: 2 },
                { nome: "Ovomaltine", precoExtra: 4, ordem: 3 },
              ],
            },
          },
        ],
      },
    },
  });

  // Bebidas (produtos simples).
  await prisma.produto.createMany({
    data: [
      { nome: "Água mineral", preco: 3, montavel: false, categoriaId: CAT_BEBIDAS },
      { nome: "Refrigerante lata", preco: 6, montavel: false, categoriaId: CAT_BEBIDAS },
      { nome: "Suco natural", preco: 8, montavel: false, categoriaId: CAT_BEBIDAS },
    ],
  });

  // Config da loja (linha única). Mantém a existente se já houver.
  const cfg = await prisma.configLoja.findFirst();
  if (!cfg) {
    await prisma.configLoja.create({
      data: {
        nomeLoja: "Qbombom Sorvetes",
        tipoTaxa: "FIXA",
        taxaFixa: 5,
        pedidoMinimo: 15,
        pausado: false,
      },
    });
  }

  const totalProdutos = await prisma.produto.count({
    where: { categoriaId: { in: [CAT_ACAI, CAT_BEBIDAS] } },
  });
  console.log(
    `✓ Catálogo semeado: 2 categorias, ${totalProdutos} produtos, config da loja OK.`,
  );
}

main()
  .catch((err) => {
    console.error("Erro no seed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
