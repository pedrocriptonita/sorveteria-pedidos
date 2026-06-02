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
        <div className="flex flex-col">
          <span className="text-sm font-semibold">Sorveteria · Admin</span>
          <span className="text-xs text-neutral-500">{user.email}</span>
        </div>
        <LogoutButton />
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
