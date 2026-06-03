/**
 * Valida a fila de impressão de ponta a ponta no nível de dados:
 * cria pedido de teste → enfileira → busca pendentes → marca IMPRESSO →
 * limpa tudo. Não exige impressora nem o agente; prova o contrato da fila.
 *
 * Uso: npm run validate:print
 */
import { prisma } from "@/lib/prisma";
import {
  buscarJobsPendentes,
  enfileirarImpressao,
  marcarImpresso,
} from "@/lib/print/queue";
import type { ComandaPayload } from "@/lib/print/types";

const TELEFONE_TESTE = "00000000000";

async function main() {
  // --- setup ---
  const cliente = await prisma.cliente.upsert({
    where: { telefone: TELEFONE_TESTE },
    update: {},
    create: { nome: "Teste Validação", telefone: TELEFONE_TESTE },
  });

  const pedido = await prisma.pedido.create({
    data: {
      tipoEntrega: "RETIRADA",
      formaPagamento: "DINHEIRO",
      subtotal: 25.9,
      total: 25.9,
      clienteId: cliente.id,
    },
  });

  const conteudo: ComandaPayload = {
    numeroPedido: pedido.numero,
    tipoEntrega: "RETIRADA",
    itens: [{ nome: "Açaí 500ml", quantidade: 1, observacao: "sem granola" }],
    total: 25.9,
    criadoEm: new Date().toISOString(),
  };

  try {
    // --- fluxo ---
    const job = await enfileirarImpressao(pedido.id, conteudo);
    console.log(`1) Enfileirado: job ${job.id} (${job.status})`);

    const pendentes = await buscarJobsPendentes();
    const aparece = pendentes.some((j) => j.id === job.id);
    console.log(`2) Aparece na fila: ${aparece} (${pendentes.length} pendente(s))`);

    const impresso = await marcarImpresso(job.id);
    console.log(
      `3) Marcado: ${impresso?.status} em ${impresso?.impressoEm?.toISOString()}`,
    );

    if (!aparece || impresso?.status !== "IMPRESSO") {
      throw new Error("Fila de impressão NÃO validada.");
    }
    console.log("\n✓ Fila de impressão validada com sucesso.");
  } finally {
    // --- limpeza (cascade remove os jobs do pedido) ---
    await prisma.pedido.deleteMany({ where: { clienteId: cliente.id } });
    await prisma.cliente.delete({ where: { id: cliente.id } });
    console.log("4) Limpeza: pedido + job + cliente de teste removidos.");
  }
}

main()
  .catch((err) => {
    console.error("Erro:", (err as Error).message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
