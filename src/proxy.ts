import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next 16: a convenção "middleware" virou "proxy" (mesma API + config.matcher).
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  /**
   * Roda em todas as rotas, exceto estáticos e otimização de imagem.
   * (Padrão recomendado pela doc do @supabase/ssr.)
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
