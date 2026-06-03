import "server-only";
import { env } from "@/lib/env";

/**
 * Autentica o agente de impressão por token: aceita `Authorization: Bearer
 * <token>` ou o header `x-print-token`. Se PRINT_AGENT_TOKEN não estiver
 * configurado, ninguém é autorizado (retorna false).
 */
export function validarAgente(req: Request): boolean {
  const esperado = env.printAgentToken;
  if (!esperado) return false;

  const auth = req.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  const recebido = bearer ?? req.headers.get("x-print-token");

  return !!recebido && recebido === esperado;
}
