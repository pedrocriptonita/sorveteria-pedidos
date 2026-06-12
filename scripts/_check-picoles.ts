import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

async function main() {
  const cat = await p.categoria.findFirst({ where: { nome: "Picolés", deletedAt: null } });
  if (!cat) throw new Error("sem categoria");

  const subs = await p.subcategoria.findMany({
    where: { categoriaId: cat.id, deletedAt: null },
    orderBy: { ordem: "asc" },
  });

  for (const s of subs) {
    const prods = await p.produto.findMany({
      where: { subcategoriaId: s.id, deletedAt: null },
      select: { nome: true, preco: true },
    });
    console.log(`\n▸ ${s.nome}`);
    for (const pr of prods) console.log(`   ${pr.nome} — ${pr.preco ? "R$ " + Number(pr.preco).toFixed(2) : "SEM PREÇO"}`);
  }
}
main().finally(() => p.$disconnect());
