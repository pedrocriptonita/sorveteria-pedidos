"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import type { CartItem } from "../types";

const STORAGE_KEY = "sorveteria:carrinho:v1";

// Detecta "já hidratou" sem setState em effect (evita a regra react-hooks
// set-state-in-effect): no servidor retorna false; no client, true após montar.
const subscribeNoop = () => () => {};
function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
}

interface CartContextValue {
  itens: CartItem[];
  totalItens: number;
  subtotal: number;
  /** Adiciona uma linha (gera o linhaId). */
  adicionar: (item: Omit<CartItem, "linhaId">) => void;
  alterarQuantidade: (linhaId: string, quantidade: number) => void;
  remover: (linhaId: string) => void;
  limpar: () => void;
  /** Indica que o estado já foi hidratado do localStorage. */
  pronto: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

function lerCarrinhoInicial(): CartItem[] {
  if (typeof window === "undefined") return []; // SSR: começa vazio
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return []; // JSON inválido
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  // Inicialização lazy: no client já lê o localStorage no 1º render. Tudo que
  // depende dos itens fica atrás de `pronto`, então o HTML do 1º render bate
  // com o do servidor (sem mismatch); `pronto` vira true após montar.
  const [itens, setItens] = useState<CartItem[]>(lerCarrinhoInicial);
  const pronto = useHydrated();

  // Persiste a cada mudança (só depois de hidratar).
  useEffect(() => {
    if (!pronto) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(itens));
  }, [itens, pronto]);

  const adicionar = useCallback((item: Omit<CartItem, "linhaId">) => {
    setItens((atual) => [...atual, { ...item, linhaId: crypto.randomUUID() }]);
  }, []);

  const alterarQuantidade = useCallback((linhaId: string, quantidade: number) => {
    setItens((atual) =>
      quantidade <= 0
        ? atual.filter((i) => i.linhaId !== linhaId)
        : atual.map((i) => (i.linhaId === linhaId ? { ...i, quantidade } : i)),
    );
  }, []);

  const remover = useCallback((linhaId: string) => {
    setItens((atual) => atual.filter((i) => i.linhaId !== linhaId));
  }, []);

  const limpar = useCallback(() => setItens([]), []);

  const value = useMemo<CartContextValue>(() => {
    const totalItens = itens.reduce((s, i) => s + i.quantidade, 0);
    const subtotal = itens.reduce(
      (s, i) => s + i.precoUnitario * i.quantidade,
      0,
    );
    return {
      itens,
      totalItens,
      subtotal,
      adicionar,
      alterarQuantidade,
      remover,
      limpar,
      pronto,
    };
  }, [itens, adicionar, alterarQuantidade, remover, limpar, pronto]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart deve ser usado dentro de <CartProvider>.");
  return ctx;
}
