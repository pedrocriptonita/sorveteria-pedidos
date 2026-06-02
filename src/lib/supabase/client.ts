import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicConfig } from "@/lib/env";

/**
 * Client do Supabase para uso no browser (Client Components).
 * Usa a chave anon pública — toda a autorização real acontece no servidor.
 */
export function createClient() {
  const { url, anonKey } = getSupabasePublicConfig();
  return createBrowserClient(url, anonKey);
}
