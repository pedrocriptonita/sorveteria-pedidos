/**
 * Seed completo do catálogo — roda em cima do banco existente.
 * Idempotente: pula o que já existe (por nome dentro da categoria/subcategoria).
 *
 * npm run db:seed-catalogo-completo
 */
import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getOrCreateCategoria(nome: string, ordemFallback: number) {
  const existente = await p.categoria.findFirst({
    where: { nome, deletedAt: null },
  });
  if (existente) return existente;
  const max = await p.categoria.aggregate({ _max: { ordem: true } });
  return p.categoria.create({
    data: { nome, ordem: (max._max.ordem ?? 0) + 1, ativo: true },
  });
}

async function getOrCreateSubcategoria(categoriaId: string, nome: string, ordem: number) {
  const existente = await p.subcategoria.findFirst({
    where: { categoriaId, nome, deletedAt: null },
  });
  if (existente) return existente;
  return p.subcategoria.create({
    data: { categoriaId, nome, ordem, ativo: true },
  });
}

async function criarProduto(
  categoriaId: string,
  nome: string,
  preco: number | null,
  subcategoriaId?: string,
) {
  const existe = await p.produto.findFirst({
    where: { categoriaId, nome, deletedAt: null },
  });
  if (existe) {
    console.log(`     · Já existe: ${nome}`);
    return;
  }
  await p.produto.create({
    data: {
      categoriaId,
      subcategoriaId: subcategoriaId ?? null,
      nome,
      preco,
      montavel: false,
      disponivel: true,
    },
  });
  console.log(`     + ${nome}${preco ? ` (R$ ${preco.toFixed(2)})` : ""}`);
}

// ---------------------------------------------------------------------------
// Dados
// ---------------------------------------------------------------------------

async function seedPicoles() {
  console.log("\n📦 PICOLÉS");
  const cat = await getOrCreateCategoria("Picolés", 10);

  const subcats: { subNome: string; produtos: string[] }[] = [
    {
      subNome: "Picolé Linha Cremoso",
      produtos: ["Cremoso Morango", "Cremoso Coco", "Cremoso Leite Condensado"],
    },
    {
      subNome: "Picolé Linha Qmaxx",
      produtos: ["Maxx Sonho de Valsa", "Maxx Pistache", "Maxx Brigadeiro"],
    },
    {
      subNome: "Picolé Linha Kids",
      produtos: ["Chiclete Rosa"],
    },
    {
      subNome: "Picolé Linha Skimo Premium",
      produtos: ["Skimo Leite Condensado"],
    },
    {
      subNome: "Picolé Skimo",
      produtos: ["Chocolate", "Chocolate Branco", "Morango"],
    },
    {
      subNome: "Picolé Linha Speciale",
      produtos: ["Bombom Branco", "Doce de Leite", "Maltine", "Bombom Ferrero"],
    },
    {
      subNome: "Picolé Linha Q Fruta",
      produtos: ["Morango", "Limão"],
    },
    {
      subNome: "Picolé Comum",
      produtos: [
        "Açaí", "Biscoito", "Leite Condensado", "Amendoim",
        "Morango", "Milho Verde", "Coco", "Chocolate",
      ],
    },
  ];

  for (const [i, { subNome, produtos }] of subcats.entries()) {
    console.log(`  ▸ ${subNome}`);
    const sub = await getOrCreateSubcategoria(cat.id, subNome, i + 1);
    for (const nome of produtos) {
      await criarProduto(cat.id, nome, null, sub.id);
    }
  }
}

async function seedSobremesas() {
  console.log("\n📦 SOBREMESAS");
  const cat = await getOrCreateCategoria("Sobremesas", 11);

  const produtos = [
    { nome: "Milkshake Tradicional", preco: 19.9 },
    { nome: "Milkshake Gourmet", preco: 24.9 },
  ];

  for (const { nome, preco } of produtos) {
    await criarProduto(cat.id, nome, preco);
  }
}

async function seedPotesSorvetes() {
  console.log("\n📦 POTES DE SORVETES");
  const cat = await getOrCreateCategoria("Potes de Sorvetes", 12);

  const subcats: { subNome: string; ordem: number; produtos: string[] }[] = [
    {
      subNome: "Pote 1 Litro",
      ordem: 1,
      produtos: ["Napolitano", "Flocos"],
    },
    {
      subNome: "Pote 1,5L",
      ordem: 2,
      produtos: [
        "1.5L Cookies e Cream",
        "1.5L Iogurte Grego",
        "1.5L Leitinho Trufado",
        "1.5L Qgresco",
        "1.5L Copa Trio",
        "1.5L Qmaltine",
      ],
    },
    {
      subNome: "Pote 2 Litros",
      ordem: 3,
      produtos: [
        "Napolitano 2LT",
        "Trio 2LT",
        "Creme c/ Passas 2LT",
        "Unicórnio 2LT",
        "Sonho de Valsa 2LT",
        "Pavê 2LT",
        "Brownie 2LT",
        "Toffee 2LT",
        "Nata Goiaba 2LT",
        "Flocos 2LT",
        "Chocolate 2LT",
        "Abacaxi 2LT",
      ],
    },
  ];

  for (const { subNome, ordem, produtos } of subcats) {
    console.log(`  ▸ ${subNome}`);
    const sub = await getOrCreateSubcategoria(cat.id, subNome, ordem);
    for (const nome of produtos) {
      await criarProduto(cat.id, nome, null, sub.id);
    }
  }
}

async function seedLinhaGelato() {
  console.log("\n📦 LINHA GELATO");
  const cat = await getOrCreateCategoria("Linha Gelato", 13);

  const produtos = [
    { nome: "Cheesecake de Uva 700g", preco: 29.5 },
    { nome: "Chocolate Belga 700g", preco: 29.5 },
    { nome: "Açaí Zero 900g", preco: 49.9 },
    { nome: "Bombom Ferrero 700g", preco: 29.5 },
  ];

  for (const { nome, preco } of produtos) {
    await criarProduto(cat.id, nome, preco);
  }
}

async function seedLinhaPronta() {
  console.log("\n📦 LINHA PRONTA");
  const cat = await getOrCreateCategoria("Linha Pronta", 14);

  const subcats: { subNome: string; ordem: number; produtos: string[] }[] = [
    {
      subNome: "Qcopão 400ml",
      ordem: 1,
      produtos: ["Trio", "Flocos"],
    },
    {
      subNome: "Qsundae 180ml",
      ordem: 2,
      produtos: ["Chocolate"],
    },
    {
      subNome: "Minisundae Choc/Morango",
      ordem: 3,
      produtos: ["Morango"],
    },
    {
      subNome: "Potinho 90ml",
      ordem: 4,
      produtos: ["Potinho Morango"],
    },
    {
      subNome: "Açaí 1kg",
      ordem: 5,
      produtos: ["Açaí c/Morango", "Açaí Natural", "Açaí+Leitinho"],
    },
    {
      subNome: "Qaçaí 200g",
      ordem: 6,
      produtos: ["Açaí com Leite em Pó", "Açaí com Granola"],
    },
  ];

  for (const { subNome, ordem, produtos } of subcats) {
    console.log(`  ▸ ${subNome}`);
    const sub = await getOrCreateSubcategoria(cat.id, subNome, ordem);
    for (const nome of produtos) {
      await criarProduto(cat.id, nome, null, sub.id);
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  await seedPicoles();
  await seedSobremesas();
  await seedPotesSorvetes();
  await seedLinhaGelato();
  await seedLinhaPronta();
  console.log("\n✅ Seed concluído.");
}

main()
  .catch((err) => { console.error("Erro:", err); process.exit(1); })
  .finally(() => p.$disconnect());
