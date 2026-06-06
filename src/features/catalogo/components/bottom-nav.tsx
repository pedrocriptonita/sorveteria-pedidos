"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "../cart/cart-provider";

const NAV = [
  { href: "/", icon: "restaurant_menu", label: "Cardápio" },
  { href: "/carrinho", icon: "shopping_cart", label: "Carrinho" },
  { href: "/pedidos", icon: "receipt_long", label: "Pedidos" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { totalItens, pronto } = useCart();

  return (
    <nav className="fixed bottom-0 w-full z-50 rounded-t-2xl bg-background/90 backdrop-blur-md shadow-[0px_-4px_20px_rgba(0,0,0,0.06)] border-t border-border/40 flex justify-around items-center h-20 px-4">
      {NAV.map(({ href, icon, label }) => {
        const isActive =
          href === "/" ? pathname === "/" : pathname.startsWith(href);
        const isCarrinho = href === "/carrinho";

        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center justify-center w-16 h-full transition-all active:scale-90 ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <div
              className={`relative px-4 py-1 rounded-full mb-1 transition-colors ${
                isActive ? "bg-primary/10" : ""
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={
                  isActive
                    ? { fontVariationSettings: "'FILL' 1" }
                    : undefined
                }
              >
                {icon}
              </span>
              {isCarrinho && pronto && totalItens > 0 ? (
                <span className="absolute top-0.5 right-1 w-2 h-2 bg-primary rounded-full border border-background" />
              ) : null}
            </div>
            <span
              className={`text-[11px] leading-none ${
                isActive ? "font-bold" : "font-medium"
              }`}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
