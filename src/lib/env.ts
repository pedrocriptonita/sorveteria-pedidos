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
