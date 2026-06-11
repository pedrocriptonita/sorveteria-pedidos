import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
async function main() {
  const prod = await p.produto.findUnique({
    where: { id: "bb785cf9-ec06-4805-be04-a27e2fd487e7" },
    include: {
      gruposOpcoes: {
        include: { itens: { orderBy: { ordem: "asc" }, take: 3 } },
        orderBy: { ordem: "asc" },
      },
      categoria: true,
    },
  });
  console.log("Categoria:", prod?.categoria.nome);
  console.log("Produto:", prod?.nome);
  console.log(
    "Grupos:",
    JSON.stringify(
      prod?.gruposOpcoes.map((g) => ({ id: g.id, nome: g.nome, qtdItens: g.itens.length })),
      null, 2
    )
  );
}
main().finally(() => p.$disconnect());
