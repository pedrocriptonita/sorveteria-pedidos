import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

const GRUPO_ADICIONAIS_ID = "bbe63bbd-7232-4bdb-83aa-60f33d4f3842";

const ITENS = [
  // Frutas e Doces Especiais
  { nome: "Morango fruta", precoExtra: 2.49 },
  { nome: "Kiwi fruta", precoExtra: 2.49 },
  { nome: "Cereja artificial", precoExtra: 2.49 },
  // Secos, Chocolates e Guloseimas
  { nome: "Sucrilhos", precoExtra: 1.99 },
  { nome: "Paçoca", precoExtra: 1.99 },
  { nome: "Uva passas", precoExtra: 1.99 },
  { nome: "Marshmallow", precoExtra: 1.99 },
  { nome: "Leite em pó", precoExtra: 1.99 },
  { nome: "Granola", precoExtra: 1.99 },
  { nome: "Gotas de chocolate", precoExtra: 1.99 },
  { nome: "Farinha láctea", precoExtra: 1.99 },
  { nome: "Disquetes", precoExtra: 1.99 },
  { nome: "Dentadura fine", precoExtra: 1.99 },
  { nome: "Banana fine", precoExtra: 1.99 },
  { nome: "Chocoball", precoExtra: 1.99 },
  { nome: "Castanhas granuladas", precoExtra: 1.99 },
  { nome: "Brigadeiro", precoExtra: 1.99 },
  { nome: "Amendoim em bandas", precoExtra: 1.99 },
  // Caldas Tradicionais
  { nome: "Leite condensado", precoExtra: 2.49 },
  { nome: "Banana com leite condensado", precoExtra: 2.49 },
  // Cremes e Caldas Especiais
  { nome: "Creme de avelã", precoExtra: 3.49 },
  { nome: "Morango em caldas", precoExtra: 3.49 },
  { nome: "Creme de leite ninho", precoExtra: 3.49 },
  { nome: "Creme de bacuri", precoExtra: 3.49 },
  { nome: "Creme de amendoim", precoExtra: 3.49 },
  { nome: "Calda de cookies branco", precoExtra: 3.49 },
  { nome: "Calda quente de skimo", precoExtra: 3.49 },
];

async function main() {
  const existentes = await p.itemOpcao.findMany({
    where: { grupoId: GRUPO_ADICIONAIS_ID },
    select: { nome: true, ordem: true },
  });
  const nomesExistentes = new Set(existentes.map((i) => i.nome.toLowerCase()));
  let proximaOrdem = existentes.length > 0
    ? Math.max(...existentes.map((i) => i.ordem)) + 1
    : 1;

  let adicionados = 0;
  let pulados = 0;

  for (const item of ITENS) {
    if (nomesExistentes.has(item.nome.toLowerCase())) {
      console.log(`  · Já existe: ${item.nome}`);
      pulados++;
      continue;
    }
    await p.itemOpcao.create({
      data: {
        grupoId: GRUPO_ADICIONAIS_ID,
        nome: item.nome,
        precoExtra: item.precoExtra,
        disponivel: true,
        ordem: proximaOrdem++,
      },
    });
    console.log(`  + ${item.nome} (R$ ${item.precoExtra.toFixed(2)})`);
    adicionados++;
  }

  console.log(`\n✅ Adicionados: ${adicionados} | Pulados (já existiam): ${pulados}`);
}

main().finally(() => p.$disconnect());
