import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { LogoutButton } from "@/components/logout-button";
import { AdminNav } from "@/features/admin/components/admin-nav";

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
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Barra lateral (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-neutral-200 bg-white px-4 py-5 dark:border-neutral-800 dark:bg-neutral-900 md:flex">
        <Link
          href="/admin"
          className="mb-6 flex items-center gap-2 px-1 text-base font-bold text-primary"
        >
          <span className="material-symbols-outlined text-[22px]">
            icecream
          </span>
          DevoraFood
        </Link>

        <AdminNav orientation="vertical" />

        <div className="mt-auto flex flex-col gap-2 border-t border-neutral-100 pt-4 dark:border-neutral-800">
          <span className="truncate px-1 text-xs text-neutral-500">
            {user.email}
          </span>
          <LogoutButton />
        </div>
      </aside>

      {/* Conteúdo */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar (mobile) */}
        <header className="sticky top-0 z-30 flex flex-col gap-3 border-b border-neutral-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/90 md:hidden">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/admin"
              className="flex items-center gap-2 text-sm font-bold text-primary"
            >
              <span className="material-symbols-outlined text-[20px]">
                icecream
              </span>
              DevoraFood
            </Link>
            <LogoutButton />
          </div>
          <AdminNav orientation="horizontal" />
        </header>

        <main className="mx-auto w-full max-w-4xl p-6">{children}</main>
      </div>
    </div>
  );
}
