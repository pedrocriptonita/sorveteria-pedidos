import "server-only";
import { timingSafeEqual } from "node:crypto";

/**
 * Compara dois segredos (tokens/secrets) em TEMPO CONSTANTE, evitando
 * *timing attacks* — onde o atacante mede o tempo de resposta para descobrir
 * o segredo caractere a caractere. Retorna false se algum estiver vazio ou
 * se os tamanhos diferirem.
 */
export function secureEqual(a: string, b: string): boolean {
  if (!a || !b) return false;
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}
