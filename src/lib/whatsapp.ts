import "server-only";
import { env } from "@/lib/env";

/**
 * Client Z-API para envio de mensagens WhatsApp.
 * Docs: https://developer.z-api.io/
 *
 * Quando ZAPI_INSTANCE_ID não estiver configurado, o envio é um no-op com log
 * — assim o app funciona normalmente sem o bot em dev/staging.
 */

function zapiHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    "Client-Token": env.zapiClientToken,
  };
}

function endpoint(path: string): string {
  return `${env.zapiBaseUrl}/instances/${env.zapiInstanceId}/token/${env.zapiToken}${path}`;
}

function configurado(): boolean {
  return Boolean(env.zapiInstanceId && env.zapiToken && env.zapiClientToken);
}

/** Envia uma mensagem de texto simples para um número no formato 5511999999999. */
export async function enviarMensagem(
  telefone: string,
  mensagem: string,
): Promise<void> {
  if (!configurado()) {
    console.log(
      "[WhatsApp] Z-API não configurado. Mensagem para",
      telefone,
      ":",
      mensagem,
    );
    return;
  }

  const res = await fetch(endpoint("/send-text"), {
    method: "POST",
    headers: zapiHeaders(),
    body: JSON.stringify({ phone: telefone, message: mensagem }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Z-API /send-text ${res.status}: ${txt}`);
  }
}

/** Formata um número brasileiro para o padrão do Z-API: 5511999999999. */
export function formatarTelefone(telefone: string): string {
  const digits = telefone.replace(/\D/g, "");
  // Já tem DDI 55
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  // Adiciona DDI
  return `55${digits}`;
}

/** Valida o webhook do Z-API pelo header x-z-api-token ou secret configurado. */
export function validarWebhookZapi(req: Request): boolean {
  const secret = env.zapiWebhookSecret;
  // Sem secret configurado: aceita (útil em dev sem segredo definido).
  if (!secret) return true;
  const recebido =
    req.headers.get("x-z-api-token") ??
    req.headers.get("authorization")?.replace("Bearer ", "") ??
    "";
  return recebido === secret;
}
