"use client";

import { useHero } from "./hero-context";

/**
 * Wrapper do <main> que anima o padding-top conforme o Hero esteja em modo
 * logo (header h-36) ou modo produto (header h-60), evitando "pulo" do
 * conteúdo na transição.
 */
export function LojaMain({ children }: { children: React.ReactNode }) {
  const { produtoHero } = useHero();
  const modoProduto = produtoHero !== null;

  return (
    <main
      className={`mx-auto max-w-md px-4 pb-28 transition-[padding] duration-500 ease-out ${
        modoProduto ? "pt-52 sm:pt-56 md:pt-64" : "pt-32 sm:pt-36 md:pt-40"
      }`}
    >
      {children}
    </main>
  );
}
