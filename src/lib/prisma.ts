import { PrismaClient } from "@prisma/client";

/**
 * Cliente Prisma com RETRY em falha de conexão.
 *
 * O pooler de transações do Supabase (Supavisor, porta 6543) ocasionalmente
 * recusa a conexão (erro P1001) — um blip transitório que derrubava páginas
 * inteiras. Aqui reexecutamos a operação algumas vezes com um backoff curto.
 * P1001 significa "não alcançou o servidor", então a query NÃO rodou: reexecutar
 * é seguro (não duplica escrita).
 */
function criarPrisma() {
  return new PrismaClient().$extends({
    query: {
      async $allOperations({ args, query }) {
        const MAX_RETRY = 2;
        for (let tentativa = 0; ; tentativa++) {
          try {
            return await query(args);
          } catch (err) {
            const code = (err as { code?: string })?.code;
            if (code !== "P1001" || tentativa >= MAX_RETRY) throw err;
            await new Promise((r) => setTimeout(r, 200 * (tentativa + 1)));
          }
        }
      },
    },
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof criarPrisma>;
};

export const prisma = globalForPrisma.prisma ?? criarPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
