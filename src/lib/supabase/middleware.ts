import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicConfig } from "@/lib/env";

/** Prefixos de rota que exigem usuário autenticado no backoffice. */
const PROTECTED_PREFIXES = ["/admin", "/cozinha"];

/**
 * Renova a sessão do Supabase a cada request (escrevendo os cookies na
 * resposta) e faz a proteção GROSSA de rotas: visitante sem sessão em rota
 * protegida é mandado para /login. A checagem de PAPEL (admin vs cozinha)
 * acontece nos layouts via lib/auth/session.
 *
 * Baseado no padrão oficial do @supabase/ssr para Next.js.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const { url, anonKey } = getSupabasePublicConfig();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // IMPORTANTE: getUser() valida o token com o Supabase (não confie só no cookie).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (!user && isProtected) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
