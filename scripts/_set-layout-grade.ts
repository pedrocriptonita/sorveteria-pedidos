import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

const CATEGORIAS = ["Sobremesas", "Potes de Sorvetes", "Linha Gelato", "Linha Pronta"];

async function main() {
  for (const nome of CATEGORIAS) {
    const r = await p.categoria.updateMany({
      where: { nome, deletedAt: null },
      data: { layout: "GRADE" },
    });
    console.log(`${nome} → GRADE (${r.count} atualizada)`);
  }
  console.log("\n✅ pronto.");
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
