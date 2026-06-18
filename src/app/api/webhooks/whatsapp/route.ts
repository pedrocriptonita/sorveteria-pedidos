import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import {
  enviarMensagem,
  formatarTelefone,
  validarWebhookZapi,
} from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

// Valida só os campos que usamos do payload do Z-API; ignora o resto.
const zapiWebhookSchema = z.object({
  phone: z.string().min(1).optional(),
  fromMe: z.boolean().optional(),
  isGroup: z.boolean().optional(),
  type: z.string().optional(),
});

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

  let bruto: unknown;
  try {
    bruto = await req.json();
  } catch {
    return NextResponse.json({ error: "body inválido" }, { status: 400 });
  }

  const parsed = zapiWebhookSchema.safeParse(bruto);
  if (!parsed.success) {
    return NextResponse.json({ error: "payload inválido" }, { status: 400 });
  }
  const body = parsed.data;

  // Ignora: mensagem própria, grupo, status/ack e notificações que não são texto.
  if (
    body.fromMe === true ||
    body.isGroup === true ||
    !body.phone ||
    body.type !== "ReceivedCallback"
  ) {
    return NextResponse.json({ ignored: true });
  }

  const telefone = formatarTelefone(body.phone);
  if (!telefone) return NextResponse.json({ ignored: true });

  const appUrl = env.appUrl.replace(/\/$/, "");
  const saudacao = `Olá! 👋 Bem-vindo à Qbombom Sorvetes 🍦

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
