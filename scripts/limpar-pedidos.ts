/**
 * Apaga TODOS os pedidos (e itens, pagamentos e jobs de impressão em cascata).
 * Use para limpar os dados de teste do MVP antes de entregar / ir para produção.
 *
 * Uso:
 *   npm run db:limpar-pedidos              → dry-run (só mostra quantos apagaria)
 *   npm run db:limpar-pedidos -- --confirm → apaga de verdade
 *
 * NÃO mexe no catálogo nem nos clientes cadastrados — só nos pedidos.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const confirmar = process.argv.includes("--confirm");
  const total = await prisma.pedido.count();

  if (total === 0) {
    console.log("Nenhum pedido para apagar.");
    return;
  }

  if (!confirmar) {
    console.log(
      `[dry-run] ${total} pedido(s) seriam apagados (com itens, pagamentos e ` +
        `jobs de impressão em cascata).\n` +
        `Para apagar de verdade, rode:  npm run db:limpar-pedidos -- --confirm`,
    );
    return;
  }

  // ItemPedido, Pagamento e FilaImpressao têm onDelete: Cascade no pedidoId,
  // então apagar o Pedido remove tudo que depende dele.
  const r = await prisma.pedido.deleteMany({});
  console.log(
    `✓ ${r.count} pedido(s) apagados (itens, pagamentos e jobs em cascata).`,
  );
}

main()
  .catch((err) => {
    console.error("Falha ao limpar pedidos:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
