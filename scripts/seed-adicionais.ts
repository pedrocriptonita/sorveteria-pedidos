/**
 * Cria a categoria ADICIONAIS com 4 subcategorias e seus produtos.
 * Seguro para rodar mais de uma vez — usa upsert por nome.
 *
 * npm run db:seed-adicionais
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SUBCATEGORIAS: {
  nome: string;
  ordem: number;
  produtos: { nome: string; preco: number }[];
}[] = [
  {
    nome: "Frutas e Doces Especiais",
    ordem: 1,
    produtos: [
      { nome: "Morango fruta", preco: 2.49 },
      { nome: "Kiwi fruta", preco: 2.49 },
      { nome: "Cereja artificial", preco: 2.49 },
    ],
  },
  {
    nome: "Secos, Chocolates e Guloseimas",
    ordem: 2,
    produtos: [
      { nome: "Sucrilhos", preco: 1.99 },
      { nome: "Paçoca", preco: 1.99 },
      { nome: "Uva passas", preco: 1.99 },
      { nome: "Marshmallow", preco: 1.99 },
      { nome: "Leite em pó", preco: 1.99 },
      { nome: "Granola", preco: 1.99 },
      { nome: "Gotas de chocolate", preco: 1.99 },
      { nome: "Farinha láctea", preco: 1.99 },
      { nome: "Disquetes", preco: 1.99 },
      { nome: "Dentadura fine", preco: 1.99 },
      { nome: "Banana fine", preco: 1.99 },
      { nome: "Chocoball", preco: 1.99 },
      { nome: "Castanhas granuladas", preco: 1.99 },
      { nome: "Brigadeiro", preco: 1.99 },
      { nome: "Amendoim em bandas", preco: 1.99 },
    ],
  },
  {
    nome: "Caldas Tradicionais",
    ordem: 3,
    produtos: [
      { nome: "Leite condensado", preco: 2.49 },
      { nome: "Banana com Leite condensado", preco: 2.49 },
    ],
  },
  {
    nome: "Cremes e Caldas Especiais",
    ordem: 4,
    produtos: [
      { nome: "Creme de avelã", preco: 3.49 },
      { nome: "Morango em caldas", preco: 3.49 },
      { nome: "Creme de leite ninho", preco: 3.49 },
      { nome: "Creme de bacuri", preco: 3.49 },
      { nome: "Creme de amendoim", preco: 3.49 },
      { nome: "Calda de cookies branco", preco: 3.49 },
      { nome: "Calda quente de skimo", preco: 3.49 },
    ],
  },
];

async function main() {
  // 1. Garantir categoria ADICIONAIS
  let cat = await prisma.categoria.findFirst({
    where: { nome: "Adicionais", deletedAt: null },
  });
  if (!cat) {
    const maxOrdem = await prisma.categoria.aggregate({ _max: { ordem: true } });
    cat = await prisma.categoria.create({
      data: {
        nome: "Adicionais",
        ordem: (maxOrdem._max.ordem ?? 0) + 1,
        ativo: true,
      },
    });
    console.log(`✓ Categoria criada: Adicionais (${cat.id})`);
  } else {
    console.log(`→ Categoria já existe: Adicionais (${cat.id})`);
  }

  // 2. Criar subcategorias e produtos
  for (const sub of SUBCATEGORIAS) {
    let subcat = await prisma.subcategoria.findFirst({
      where: { categoriaId: cat.id, nome: sub.nome, deletedAt: null },
    });
    if (!subcat) {
      subcat = await prisma.subcategoria.create({
        data: {
          categoriaId: cat.id,
          nome: sub.nome,
          ordem: sub.ordem,
          ativo: true,
        },
      });
      console.log(`  ✓ Subcategoria criada: ${sub.nome}`);
    } else {
      console.log(`  → Subcategoria já existe: ${sub.nome}`);
    }

    // 3. Criar produtos na subcategoria
    for (const [i, prod] of sub.produtos.entries()) {
      const existe = await prisma.produto.findFirst({
        where: { categoriaId: cat.id, nome: prod.nome, deletedAt: null },
      });
      if (existe) {
        console.log(`     · Já existe: ${prod.nome}`);
        continue;
      }
      // Calcula próxima ordem dentro da categoria
      const maxProd = await prisma.produto.aggregate({
        _max: { ordem: true },
        where: { categoriaId: cat.id },
      });
      await prisma.produto.create({
        data: {
          categoriaId: cat.id,
          subcategoriaId: subcat.id,
          nome: prod.nome,
          preco: prod.preco,
          ordem: (maxProd._max.ordem ?? 0) + 1,
          montavel: false,
          disponivel: true,
          ativo: true,
        },
      });
      console.log(`     + Adicionado: ${prod.nome} (R$ ${prod.preco.toFixed(2)})`);
    }
  }

  console.log("\n✅ Seed concluído.");
}

main()
  .catch((err) => {
    console.error("Erro:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
