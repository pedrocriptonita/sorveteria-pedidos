import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

async function main() {
  const cat = await p.categoria.findFirst({ where: { nome: "Picolés", deletedAt: null } });
  if (!cat) throw new Error("sem categoria");

  const faltantes: { sub: string; nome: string; preco: number }[] = [
    { sub: "Picolé Linha Q Fruta", nome: "Morango", preco: 2.5 },
    { sub: "Picolé Comum", nome: "Morango", preco: 2.0 },
    { sub: "Picolé Comum", nome: "Chocolate", preco: 2.0 },
  ];

  for (const f of faltantes) {
    const sub = await p.subcategoria.findFirst({
      where: { categoriaId: cat.id, nome: f.sub, deletedAt: null },
    });
    if (!sub) { console.log(`⚠️  sub não achada: ${f.sub}`); continue; }

    const existe = await p.produto.findFirst({
      where: { subcategoriaId: sub.id, nome: f.nome, deletedAt: null },
    });
    if (existe) { console.log(`· já existe em ${f.sub}: ${f.nome}`); continue; }

    await p.produto.create({
      data: {
        categoriaId: cat.id,
        subcategoriaId: sub.id,
        nome: f.nome,
        preco: f.preco,
        montavel: false,
        disponivel: true,
      },
    });
    console.log(`+ ${f.sub} → ${f.nome} (R$ ${f.preco.toFixed(2)})`);
  }
  console.log("\n✅ pronto.");
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
