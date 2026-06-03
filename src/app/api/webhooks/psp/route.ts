import { NextResponse } from "next/server";
import { getPsp } from "@/lib/psp";
import { aplicarEventoPagamento } from "@/features/pedido/pagamento";

// Webhook do PSP: sempre dinâmico; nunca cacheado.
export const dynamic = "force-dynamic";

/**
 * Recebe notificações do PSP (ex.: Asaas PAYMENT_CONFIRMED).
 * Lê o corpo CRU (necessário para validar a assinatura/segredo), valida via
 * o provider configurado e concilia o Pagamento de forma idempotente.
 *
 * Responde 200 mesmo quando o Pagamento não existe localmente (ack), para o
 * PSP não ficar reenviando — relevante na Fase 3, onde ainda não há pedidos.
 */
export async function POST(req: Request) {
  const rawBody = await req.text();

  const psp = getPsp();
  const evento = await psp.validarWebhook(req, rawBody);

  if (!evento) {
    return NextResponse.json(
      { error: "Webhook inválido ou não autenticado." },
      { status: 401 },
    );
  }

  const resultado = await aplicarEventoPagamento(evento.txid, evento.status);

  return NextResponse.json({
    received: true,
    txid: evento.txid,
    evento: evento.tipoOriginal,
    ...resultado,
  });
}
