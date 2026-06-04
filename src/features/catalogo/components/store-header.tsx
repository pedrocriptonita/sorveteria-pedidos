"use client";

import Link from "next/link";
import { useCart } from "../cart/cart-provider";

export function StoreHeader() {
  const { totalItens, pronto } = useCart();

  return (
    <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md shadow-sm border-b border-border/40 flex items-center justify-between px-4 h-16">
      {/* Ícone esquerdo — identidade da loja */}
      <div className="flex items-center justify-center w-10 h-10 text-muted-foreground">
        <span className="material-symbols-outlined">icecream</span>
      </div>

      {/* Nome central */}
      <Link href="/" className="text-2xl font-extrabold text-primary tracking-tight">
        Qbombom Sorvetes
      </Link>

      {/* Carrinho com badge */}
      <Link
        href="/carrinho"
        className="flex items-center justify-center w-10 h-10 text-muted-foreground hover:text-primary transition-colors relative rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <span className="material-symbols-outlined">shopping_cart</span>
        {pronto && totalItens > 0 ? (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background" />
        ) : null}
      </Link>
    </header>
  );
}
