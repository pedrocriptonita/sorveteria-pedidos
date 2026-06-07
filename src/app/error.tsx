"use client";

import { useEffect } from "react";

/**
 * Tela de erro global (App Router). Substitui a tela técnica do Next por uma
 * mensagem amigável com a marca. `reset()` tenta renderizar o segmento de novo
 * (útil para erros transitórios, ex.: blip de conexão com o banco).
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-8 text-center">
      <span className="text-5xl" aria-hidden>
        🍦
      </span>
      <h1 className="text-xl font-bold">Algo deu errado</h1>
      <p className="text-sm text-muted-foreground">
        Tivemos um probleminha ao carregar esta página. Tente novamente em
        instantes.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Tentar novamente
      </button>
    </main>
  );
}
