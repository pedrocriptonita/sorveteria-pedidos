/**
 * Persistência do "login leve" do cliente (nome + telefone) no localStorage.
 * Centraliza a chave e os helpers para não duplicar entre checkout e hub.
 * Client-only (usa `window`/`localStorage`).
 */

const CLIENTE_KEY = "sorveteria:cliente:v1";

export interface ClienteSalvo {
  nome: string;
  telefone: string;
}

/** Lê o cliente recorrente. null se ausente, inválido ou no SSR. */
export function lerClienteSalvo(): ClienteSalvo | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CLIENTE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as Partial<ClienteSalvo>;
    if (c.nome && c.telefone) return { nome: c.nome, telefone: c.telefone };
  } catch {
    // JSON inválido — ignora
  }
  return null;
}

/** Persiste o cliente recorrente (best-effort; ignora erro de quota/privado). */
export function salvarCliente(cliente: ClienteSalvo): void {
  try {
    window.localStorage.setItem(CLIENTE_KEY, JSON.stringify(cliente));
  } catch {
    // ignora
  }
}
