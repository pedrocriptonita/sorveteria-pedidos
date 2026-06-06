import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";

export default async function AdminHome() {
  const user = await requireAdmin();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Painel administrativo</h1>
        <p className="text-sm text-neutral-500">Olá, {user.nome}.</p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          {
            href: "/admin/catalogo",
            icone: "icecream",
            titulo: "Catálogo",
            desc: "Categorias, produtos, montável e disponibilidade.",
            cor: "bg-pink-50 text-pink-600 dark:bg-pink-950",
          },
          {
            href: "/admin/pedidos",
            icone: "receipt_long",
            titulo: "Pedidos",
            desc: "Acompanhar e cancelar pedidos (com estorno PIX).",
            cor: "bg-blue-50 text-blue-600 dark:bg-blue-950",
          },
          {
            href: "/admin/clientes",
            icone: "group",
            titulo: "Clientes",
            desc: "Bloquear/desbloquear (anti-trote do dinheiro).",
            cor: "bg-amber-50 text-amber-600 dark:bg-amber-950",
          },
          {
            href: "/admin/config",
            icone: "settings",
            titulo: "Configuração",
            desc: "Pausar pedidos, taxa de entrega, pedido mínimo, zonas.",
            cor: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950",
          },
        ].map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-primary/40 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${c.cor}`}
            >
              <span className="material-symbols-outlined text-[22px]">
                {c.icone}
              </span>
            </span>
            <div className="flex flex-col">
              <p className="font-semibold">{c.titulo}</p>
              <p className="text-sm text-neutral-500">{c.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
