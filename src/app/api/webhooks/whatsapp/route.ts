import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import {
  enviarMensagem,
  formatarTelefone,
  validarWebhookZapi,
} from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

/**
 * Webhook do Z-API — recebe notificações de mensagens recebidas.
 *
 * Z-API entrega um POST para esta URL quando uma mensagem chega no número
 * conectado. O bot ignora mensagens próprias (fromMe) e grupos, e responde
 * a qualquer texto de cliente com saudação + link do cardápio.
 *
 * Configuração no painel Z-API:
 *   Webhooks → Receber → URL: https://SEU_DOMINIO/api/webhooks/whatsapp
 */
export async function POST(req: Request) {
  if (!validarWebhookZapi(req)) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "body inválido" }, { status: 400 });
  }

  // Ignora: mensagem própria, grupo, status/ack e notificações que não são texto.
  if (
    body.fromMe === true ||
    body.isGroup === true ||
    !body.phone ||
    body.type !== "ReceivedCallback"
  ) {
    return NextResponse.json({ ignored: true });
  }

  const telefone = formatarTelefone(String(body.phone ?? ""));
  if (!telefone) return NextResponse.json({ ignored: true });

  const appUrl = env.appUrl.replace(/\/$/, "");
  const saudacao = `Olá! 👋 Bem-vindo à Sorveteria do Pedro 🍦

Monte seu pedido agora pelo nosso cardápio digital:
👉 ${appUrl}

Se tiver alguma dúvida, é só falar! 😊`;

  try {
    await enviarMensagem(telefone, saudacao);
  } catch (err) {
    console.error("[WhatsApp webhook] Falha ao enviar:", (err as Error).message);
    // Mesmo com falha no envio, responde 200 para o Z-API não reenviar.
  }

  return NextResponse.json({ ok: true });
}
