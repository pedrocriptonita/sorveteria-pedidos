import { NextResponse } from "next/server";
import { env } from "@/lib/env";

// Sempre dinâmico: reflete o estado em tempo de requisição.
export const dynamic = "force-dynamic";

export async function GET() {
  // Apenas booleanos de "está configurado?" — nunca os valores das chaves.
  const integracoes = {
    supabase: Boolean(env.supabaseUrl && env.supabaseAnonKey),
    psp: {
      provider: env.pspProvider,
      configurado: Boolean(env.pspBaseUrl && env.pspApiKey),
      webhookSecret: Boolean(env.pspWebhookSecret),
    },
    impressao: {
      modo: env.printMode,
      agenteConfigurado: Boolean(env.printAgentToken),
    },
  };

  return NextResponse.json({
    status: "ok",
    service: "sorveteria-pedidos",
    env: env.nodeEnv,
    integracoes,
    timestamp: new Date().toISOString(),
  });
}
