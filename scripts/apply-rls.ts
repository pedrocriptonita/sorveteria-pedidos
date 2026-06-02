/**
 * Aplica prisma/rls.sql no banco usando a conexão do Prisma (role privilegiada).
 * Uso: npm run db:rls
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const sqlPath = join(process.cwd(), "prisma", "rls.sql");
  const sql = readFileSync(sqlPath, "utf8");

  // Remove linhas de comentário antes de separar por ";" para não grudar
  // o cabeçalho de comentários na primeira instrução.
  const statements = sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    await prisma.$executeRawUnsafe(stmt);
  }

  console.log(`RLS aplicado: ${statements.length} comandos executados.`);
}

main()
  .catch((err) => {
    console.error("Falha ao aplicar RLS:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
