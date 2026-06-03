import { getClientes } from "@/features/admin/operacao-data";
import { toggleClienteBloqueado } from "@/features/admin/operacao-actions";

export const dynamic = "force-dynamic";

export default async function ClientesAdminPage() {
  const clientes = await getClientes();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Clientes</h1>
      <p className="text-sm text-neutral-500">
        Bloquear impede o cliente de pagar em dinheiro (mitigação anti-trote).
      </p>

      {clientes.length === 0 ? (
        <p className="py-16 text-center text-neutral-500">
          Nenhum cliente ainda.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-neutral-100 dark:divide-neutral-800">
          {clientes.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-2 py-3"
            >
              <div className="flex flex-col gap-0.5 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{c.nome}</span>
                  {c.bloqueado ? (
                    <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
                      bloqueado
                    </span>
                  ) : null}
                </div>
                <span className="text-xs text-neutral-500">
                  {c.telefone} · {c.qtdPedidos} pedido(s)
                </span>
              </div>
              <form action={toggleClienteBloqueado}>
                <input type="hidden" name="id" value={c.id} />
                <button
                  type="submit"
                  className={`rounded-md border px-3 py-1.5 text-xs transition ${
                    c.bloqueado
                      ? "border-neutral-300 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                      : "border-red-300 text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
                  }`}
                >
                  {c.bloqueado ? "Desbloquear" : "Bloquear"}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
