"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin/catalogo", icon: "icecream", label: "Catálogo" },
  { href: "/admin/pedidos", icon: "receipt_long", label: "Pedidos" },
  { href: "/admin/clientes", icon: "group", label: "Clientes" },
  { href: "/admin/config", icon: "settings", label: "Configuração" },
];

/**
 * Navegação do backoffice. Destaca o item ativo pela rota atual.
 * `orientation="vertical"` para a barra lateral (desktop); `"horizontal"`
 * para a faixa rolável no topo (mobile).
 */
export function AdminNav({
  orientation = "vertical",
}: {
  orientation?: "vertical" | "horizontal";
}) {
  const pathname = usePathname();
  const vertical = orientation === "vertical";

  return (
    <nav
      className={
        vertical
          ? "flex flex-col gap-1"
          : "no-scrollbar flex gap-1 overflow-x-auto"
      }
    >
      {ITEMS.map((it) => {
        const ativo =
          pathname === it.href || pathname.startsWith(`${it.href}/`);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              vertical ? "" : "whitespace-nowrap"
            } ${
              ativo
                ? "bg-primary/10 text-primary"
                : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {it.icon}
            </span>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
