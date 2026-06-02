import { requireAdmin } from "@/lib/auth/session";

export default async function AdminHome() {
  const user = await requireAdmin();

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-bold">Painel administrativo</h1>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Olá, {user.nome}. Autenticação (Fase 2) funcionando — papel{" "}
        <strong>{user.papel}</strong>.
      </p>
      <p className="text-sm text-neutral-500">
        As funcionalidades de configuração e operação chegam na Fase 7.
      </p>
    </div>
  );
}
