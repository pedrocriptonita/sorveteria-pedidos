import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { LogoutButton } from "@/components/logout-button";

// Painel autenticado: sempre renderizado por requisição (lê sessão dos cookies).
export const dynamic = "force-dynamic";

/**
 * Layout do painel administrativo. Exige papel ADMIN (requireAdmin redireciona
 * cozinha → /cozinha e visitante → /login). A proteção grossa já roda no
 * middleware; aqui validamos o PAPEL.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-3 dark:border-neutral-800">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-sm font-semibold">
            Sorveteria · Admin
          </Link>
          <nav className="flex gap-3 text-sm text-neutral-500">
            <Link href="/admin/catalogo" className="hover:underline">
              Catálogo
            </Link>
            <Link href="/admin/pedidos" className="hover:underline">
              Pedidos
            </Link>
            <Link href="/admin/clientes" className="hover:underline">
              Clientes
            </Link>
            <Link href="/admin/config" className="hover:underline">
              Configuração
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-neutral-500 sm:inline">
            {user.email}
          </span>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-4xl p-6">{children}</main>
    </div>
  );
}
