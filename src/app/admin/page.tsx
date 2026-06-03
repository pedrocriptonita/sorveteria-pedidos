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
            titulo: "🍧 Catálogo",
            desc: "Categorias, produtos, montável e disponibilidade.",
          },
          {
            href: "/admin/pedidos",
            titulo: "🧾 Pedidos",
            desc: "Acompanhar e cancelar pedidos (com estorno PIX).",
          },
          {
            href: "/admin/clientes",
            titulo: "👤 Clientes",
            desc: "Bloquear/desbloquear (anti-trote do dinheiro).",
          },
          {
            href: "/admin/config",
            titulo: "⚙️ Configuração",
            desc: "Pausar pedidos, taxa de entrega, pedido mínimo, zonas.",
          },
        ].map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-lg border border-neutral-200 p-4 transition hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
          >
            <p className="font-medium">{c.titulo}</p>
            <p className="text-sm text-neutral-500">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
