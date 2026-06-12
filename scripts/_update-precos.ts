import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

// Atualiza preço casando por (subcategoria nome) + (produto nome).
// `todos` = aplica o mesmo preço a TODOS os produtos da subcategoria.
type Regra =
  | { sub: string; precos: Record<string, number> }
  | { sub: string; todos: number };

const REGRAS: Regra[] = [
  // PICOLÉS
  { sub: "Picolé Linha Qmaxx", precos: { "Maxx Pistache": 9.49, "Maxx Brigadeiro": 9.49 } },
  { sub: "Picolé Linha Kids", precos: { "Chiclete Rosa": 2.5 } },
  { sub: "Picolé Linha Skimo Premium", precos: { "Skimo Leite Condensado": 5.99 } },
  { sub: "Picolé Skimo", precos: { "Chocolate": 3.0, "Chocolate Branco": 3.0, "Morango": 3.0 } },
  { sub: "Picolé Linha Speciale", precos: { "Bombom Branco": 6.99, "Doce de Leite": 6.99, "Maltine": 6.99, "Bombom Ferrero": 6.99 } },
  { sub: "Picolé Linha Q Fruta", precos: { "Morango": 2.5, "Limão": 2.5 } },
  { sub: "Picolé Comum", todos: 2.0 },

  // POTES DE SORVETES
  { sub: "Pote 1,5L", todos: 29.99 },
  { sub: "Pote 2 Litros", todos: 27.99 },

  // LINHA PRONTA
  { sub: "Qcopão 400ml", precos: { "Trio": 9.49, "Flocos": 9.49 } },
  { sub: "Qsundae 180ml", precos: { "Chocolate": 6.99 } },
  { sub: "Minisundae Choc/Morango", precos: { "Morango": 5.0 } },
  { sub: "Potinho 90ml", precos: { "Potinho Morango": 3.5 } },
  { sub: "Açaí 1kg", todos: 29.99 },
  { sub: "Qaçaí 200g", todos: 11.5 },
];

async function main() {
  let atualizados = 0;

  for (const regra of REGRAS) {
    const sub = await p.subcategoria.findFirst({
      where: { nome: regra.sub, deletedAt: null },
    });
    if (!sub) { console.log(`⚠️  Subcategoria não encontrada: ${regra.sub}`); continue; }

    console.log(`\n▸ ${regra.sub}`);

    if ("todos" in regra) {
      const r = await p.produto.updateMany({
        where: { subcategoriaId: sub.id, deletedAt: null },
        data: { preco: regra.todos },
      });
      atualizados += r.count;
      console.log(`   ${r.count} produto(s) → R$ ${regra.todos.toFixed(2)}`);
    } else {
      for (const [nome, preco] of Object.entries(regra.precos)) {
        const r = await p.produto.updateMany({
          where: { subcategoriaId: sub.id, nome, deletedAt: null },
          data: { preco },
        });
        if (r.count === 0) console.log(`   ⚠️  não achei: ${nome}`);
        else { atualizados += r.count; console.log(`   ${nome} → R$ ${preco.toFixed(2)}`); }
      }
    }
  }

  console.log(`\n✅ ${atualizados} produto(s) atualizado(s).`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
