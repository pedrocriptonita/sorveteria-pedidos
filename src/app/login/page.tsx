import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getBackofficeUser } from "@/lib/auth/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar — DevoraFood",
};

// Lê a sessão dos cookies para redirecionar quem já está logado.
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  // Já logado? Vai direto para o painel conforme o papel.
  const user = await getBackofficeUser();
  if (user) redirect(user.papel === "ADMIN" ? "/admin" : "/cozinha");

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-8 p-8">
      <header className="flex flex-col items-center gap-2 text-center">
        <span className="text-4xl" aria-hidden>
          🍦
        </span>
        <h1 className="text-2xl font-bold">DevoraFood · Backoffice</h1>
        <p className="text-sm text-muted-foreground">
          Acesso restrito à equipe (admin e cozinha).
        </p>
      </header>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <LoginForm next={next} />
      </div>
    </main>
  );
}
