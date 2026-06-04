/**
 * Acesso centralizado e tipado às variáveis de ambiente.
 *
 * Vars públicas (NEXT_PUBLIC_*) podem ser lidas no browser; as demais só
 * existem no servidor. Os getters de Supabase falham cedo (throw) quando a
 * chave está faltando, para não deixar a app subir "meio configurada".
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Variável de ambiente ausente: ${name}. Confira o .env.local.`,
    );
  }
  return value;
}

export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  databaseUrl: process.env.DATABASE_URL ?? "",
  nodeEnv: process.env.NODE_ENV ?? "development",

  // Supabase — públicas (browser + server)
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",

  // PSP de PIX (server-only)
  pspProvider: process.env.PSP_PROVIDER ?? "asaas",
  pspBaseUrl: process.env.PSP_BASE_URL ?? "",
  pspApiKey: process.env.PSP_API_KEY ?? "",
  pspWebhookSecret: process.env.PSP_WEBHOOK_SECRET ?? "",
  /** CPF/CNPJ da loja usado como cliente da cobrança (cliente não digita CPF). */
  pspCpfCnpj: process.env.PSP_CPF_CNPJ ?? "",
  pixExpiracaoSegundos: Number(process.env.PIX_EXPIRACAO_SEGUNDOS ?? "900"),

  // Impressão (server-only)
  printMode: process.env.PRINT_MODE ?? "agent",
  printAgentToken: process.env.PRINT_AGENT_TOKEN ?? "",

  // WhatsApp Bot (Z-API, server-only)
  zapiBaseUrl: process.env.ZAPI_BASE_URL ?? "https://api.z-api.io",
  zapiInstanceId: process.env.ZAPI_INSTANCE_ID ?? "",
  zapiToken: process.env.ZAPI_TOKEN ?? "",
  zapiClientToken: process.env.ZAPI_CLIENT_TOKEN ?? "",
  zapiWebhookSecret: process.env.ZAPI_WEBHOOK_SECRET ?? "",
} as const;

/** Chave service_role — SOMENTE no servidor. Lança se usada sem configurar. */
export function getServiceRoleKey(): string {
  return required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** Garante que a config pública do Supabase está presente. */
export function getSupabasePublicConfig(): { url: string; anonKey: string } {
  return {
    url: required("NEXT_PUBLIC_SUPABASE_URL", env.supabaseUrl),
    anonKey: required("NEXT_PUBLIC_SUPABASE_ANON_KEY", env.supabaseAnonKey),
  };
}

/** Config do PSP para chamadas autenticadas (server-only). Lança se faltar. */
export function getPspConfig(): {
  provider: string;
  baseUrl: string;
  apiKey: string;
} {
  return {
    provider: env.pspProvider,
    baseUrl: required("PSP_BASE_URL", env.pspBaseUrl),
    apiKey: required("PSP_API_KEY", env.pspApiKey),
  };
}

/** Token de autenticação do agente de impressão (server-only). Lança se faltar. */
export function getPrintAgentToken(): string {
  return required("PRINT_AGENT_TOKEN", env.printAgentToken);
}
