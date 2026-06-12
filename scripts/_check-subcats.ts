import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

async function main() {
  const cats = await p.categoria.findMany({
    where: { deletedAt: null },
    orderBy: { ordem: "asc" },
    include: {
      subcategorias: {
        where: { deletedAt: null },
        orderBy: { ordem: "asc" },
        select: { id: true, nome: true, ordem: true },
      },
    },
  });

  for (const c of cats) {
    if (c.subcategorias.length === 0) continue;
    console.log(`\n=== ${c.nome} (ordem ${c.ordem}) ===`);
    for (const s of c.subcategorias) {
      console.log(`   [${s.ordem}] ${s.nome}`);
    }
  }
}
main().finally(() => p.$disconnect());
