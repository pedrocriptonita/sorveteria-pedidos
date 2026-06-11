import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

async function main() {
  const cat = await p.categoria.findFirst({
    where: { nome: { contains: "Picol" }, deletedAt: null },
    select: { id: true, nome: true },
  });
  if (!cat) throw new Error("Categoria Picolés não encontrada");
  console.log(`Categoria: ${cat.nome} (${cat.id})`);

  const SUBCATS = [
    "Picolé Linha Cremoso",
    "Picolé Linha Crem. Napol. e Tapioca",
    "Picolé Linha Kids",
    "Picolé Linha Qblets",
    "Picolé Linha Qmaxx",
    "Picolé Linha Skimo Premium",
    "Picolé Skimo",
    "Picolé Linha Speciale",
    "Picolé Linha Q Fruta",
    "Picolé Linha Festa",
    "Picolé Linha Recheada",
    "Picolé Comum",
    "Picolé Pinta Língua",
    "Picolé Açaí com Leitinho",
  ];

  const existentes = await p.subcategoria.findMany({
    where: { categoriaId: cat.id, deletedAt: null },
    select: { nome: true },
  });
  const nomesExistentes = new Set(existentes.map((s) => s.nome.toLowerCase()));

  let criadas = 0;
  let puladas = 0;

  for (const [i, nome] of SUBCATS.entries()) {
    if (nomesExistentes.has(nome.toLowerCase())) {
      console.log(`  · Já existe: ${nome}`);
      puladas++;
      continue;
    }
    await p.subcategoria.create({
      data: { categoriaId: cat.id, nome, ordem: i + 1, ativo: true },
    });
    console.log(`  + ${nome}`);
    criadas++;
  }

  console.log(`\n✅ Criadas: ${criadas} | Puladas: ${puladas}`);
}

main().finally(() => p.$disconnect());
