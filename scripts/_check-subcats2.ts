import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

async function main() {
  const cats = await p.categoria.findMany({
    where: { nome: { in: ["Picolés", "Linha Pronta", "Potes de Sorvetes"] }, deletedAt: null },
    orderBy: { ordem: "asc" },
    include: {
      subcategorias: {
        where: { deletedAt: null },
        orderBy: { ordem: "asc" },
        select: {
          id: true, nome: true, ordem: true,
          _count: { select: { produtos: { where: { deletedAt: null } } } },
        },
      },
    },
  });

  for (const c of cats) {
    console.log(`\n=== ${c.nome} ===`);
    for (const s of c.subcategorias) {
      console.log(`   [${s.ordem}] "${s.nome}" — ${s._count.produtos} produto(s)  id=${s.id}`);
    }
  }
}
main().finally(() => p.$disconnect());
