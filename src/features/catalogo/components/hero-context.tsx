"use client";

import { createContext, useContext, useMemo, useState } from "react";

/** Foto em destaque exibida no Hero quando o cliente está num produto. */
export interface ProdutoHero {
  foto: string | null;
  nome: string;
}

interface HeroContextValue {
  produtoHero: ProdutoHero | null;
  setProdutoHero: (p: ProdutoHero | null) => void;
}

const HeroContext = createContext<HeroContextValue | null>(null);

export function HeroProvider({ children }: { children: React.ReactNode }) {
  const [produtoHero, setProdutoHero] = useState<ProdutoHero | null>(null);
  const value = useMemo(
    () => ({ produtoHero, setProdutoHero }),
    [produtoHero],
  );
  return <HeroContext.Provider value={value}>{children}</HeroContext.Provider>;
}

export function useHero(): HeroContextValue {
  const ctx = useContext(HeroContext);
  if (!ctx) throw new Error("useHero deve ser usado dentro de <HeroProvider>.");
  return ctx;
}
