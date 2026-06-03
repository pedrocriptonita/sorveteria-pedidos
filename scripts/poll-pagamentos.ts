/**
 * Backup do webhook: concilia pagamentos PIX pendentes consultando o PSP.
 * Pensado para rodar por cron (ex.: a cada 1–2 min) ou manualmente.
 *
 * Uso: npm run poll:pagamentos
 */
import { prisma } from "@/lib/prisma";
import { reconciliarPendentes } from "@/features/pedido/pagamento";

async function main() {
  const r = await reconciliarPendentes();
  console.log(
    `Polling concluído: ${r.verificados} verificado(s), ${r.atualizados} atualizado(s).`,
  );
}

main()
  .catch((err) => {
    console.error("Erro:", (err as Error).message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
