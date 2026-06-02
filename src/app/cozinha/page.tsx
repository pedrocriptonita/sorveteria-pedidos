import { requireCozinha } from "@/lib/auth/session";

export default async function CozinhaHome() {
  const user = await requireCozinha();

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-bold">Painel da cozinha (KDS)</h1>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Olá, {user.nome}. Autenticação (Fase 2) funcionando — papel{" "}
        <strong>{user.papel}</strong>.
      </p>
      <p className="text-sm text-neutral-500">
        A fila de pedidos em tempo real chega na Fase 6.
      </p>
    </div>
  );
}
