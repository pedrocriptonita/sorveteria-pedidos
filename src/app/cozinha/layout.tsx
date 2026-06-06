import { requireCozinha } from "@/lib/auth/session";
import { LogoutButton } from "@/components/logout-button";

// Painel autenticado: sempre renderizado por requisição (lê sessão dos cookies).
export const dynamic = "force-dynamic";

/**
 * Layout do painel da cozinha (KDS). Exige sessão de backoffice; ADMIN e
 * COZINHA têm acesso. O KDS em si (tempo real) entra na Fase 6.
 */
export default async function CozinhaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireCozinha();

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-3 dark:border-neutral-800">
        <div className="flex flex-col">
          <span className="text-sm font-semibold">DevoraFood · Cozinha</span>
          <span className="text-xs text-neutral-500">{user.email}</span>
        </div>
        <LogoutButton />
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
