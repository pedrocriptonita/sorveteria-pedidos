import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getServiceRoleKey, getSupabasePublicConfig } from "@/lib/env";

import "server-only";

/**
 * Client com a chave service_role — ignora RLS e tem acesso à API de admin
 * (criar usuários, etc.). SOMENTE no servidor. Nunca importar em código que
 * roda no browser (o import "server-only" quebra o build se isso acontecer).
 */
export function createAdminClient() {
  const { url } = getSupabasePublicConfig();
  return createSupabaseClient(url, getServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
