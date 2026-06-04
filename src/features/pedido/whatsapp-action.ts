"use server";

import { prisma } from "@/lib/prisma";
import { enviarMensagem, formatarTelefone } from "@/lib/whatsapp";
import { formatBRL } from "@/lib/format";
import type { OpcaoResumo } from "@/features/catalogo/types";

export interface ResultadoEnvioWhatsapp {
  ok: boolean;
  erro?: string;
}

/**
 * Envia os detalhes do pedido para o WhatsApp do cliente.
 * Chamada pelo botão na tela de confirmação — o cliente escolhe se quer.
 */
export async function enviarDetalhesWhatsapp(
  pedidoId: string,
): Promise<ResultadoEnvioWhatsapp> {
  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    include: {
      cliente: true,
      itens: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!pedido) return { ok: false, erro: "Pedido não encontrado." };

  if (pedido.status === "AGUARDANDO_PAGAMENTO") {
    return {
      ok: false,
      erro: "Aguardando confirmação do pagamento. Tente em instantes.",
    };
  }

  // Monta a mensagem linha a linha para ficar legível no WhatsApp.
  const linhasItens = pedido.itens
    .map((item) => {
      const opcoes = (item.opcoes as OpcaoResumo[] | null) ?? [];
      const detalhes = [
        item.tamanho,
        ...opcoes.map((op) => op.itens.join(", ")),
      ]
        .filter(Boolean)
        .join(" · ");

      return `  • ${item.quantidade}× ${item.nomeProdutoSnapshot}${detalhes ? ` (${detalhes})` : ""}`;
    })
    .join("\n");

  const entrega =
    pedido.tipoEntrega === "RETIRADA"
      ? "🏪 Retirada na loja"
      : `🛵 Entrega${pedido.enderecoSnapshot ? ` — ${pedido.enderecoSnapshot}${pedido.bairroSnapshot ? `, ${pedido.bairroSnapshot}` : ""}` : ""}`;

  const pagamento =
    pedido.formaPagamento === "PIX"
      ? "✅ PIX — pago"
      : pedido.trocoPara
        ? `💵 Dinheiro — troco para ${formatBRL(Number(pedido.trocoPara))}`
        : "💵 Dinheiro";

  const mensagem = [
    `✅ *Pedido #${pedido.numero} confirmado!*`,
    "",
    linhasItens,
    "",
    pedido.observacao ? `📝 Obs: ${pedido.observacao}` : null,
    "",
    entrega,
    pagamento,
    `💰 *Total: ${formatBRL(Number(pedido.total))}*`,
    "",
    "Qualquer dúvida, é só falar! 😊",
  ]
    .filter((l) => l !== null)
    .join("\n");

  const telefone = formatarTelefone(pedido.cliente.telefone);

  try {
    await enviarMensagem(telefone, mensagem);
    return { ok: true };
  } catch (err) {
    console.error("[WhatsApp] Falha ao enviar detalhes:", (err as Error).message);
    return { ok: false, erro: "Não foi possível enviar pelo WhatsApp. Tente novamente." };
  }
}
