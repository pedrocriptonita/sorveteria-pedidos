import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicConfig } from "@/lib/env";

/**
 * Client do Supabase para Server Components, Route Handlers e Server Actions.
 * Lê/escreve a sessão nos cookies da requisição (cookies() é async no Next 15+).
 *
 * Em Server Components puros a escrita de cookies é ignorada (não há resposta
 * para setar header) — por isso o try/catch silencioso no setAll. O refresh
 * de sessão acontece no middleware.
 */
export async function createClient() {
  const { url, anonKey } = getSupabasePublicConfig();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Chamado de um Server Component — ignorar; o middleware renova.
        }
      },
    },
  });
}
