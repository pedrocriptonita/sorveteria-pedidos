"use client";

import Link from "next/link";
import { useCart } from "../cart/cart-provider";
import { formatBRL } from "@/lib/format";

export function StoreHeader() {
  const { totalItens, subtotal, pronto } = useCart();

  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-background/90 backdrop-blur dark:border-neutral-800">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 p-4">
        <Link href="/" className="text-lg font-bold">
          🍨 Sorveteria
        </Link>

        <Link
          href="/carrinho"
          className="flex items-center gap-2 rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          <span aria-hidden>🛒</span>
          {pronto && totalItens > 0 ? (
            <span>
              {totalItens} · {formatBRL(subtotal)}
            </span>
          ) : (
            <span>Carrinho</span>
          )}
        </Link>
      </div>
    </header>
  );
}
