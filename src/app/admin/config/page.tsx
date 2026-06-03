import { getConfigLojaAdmin, getZonas } from "@/features/admin/operacao-data";
import {
  criarZona,
  editarZona,
  excluirZona,
  salvarConfigLoja,
  togglePausado,
  toggleZonaAtivo,
} from "@/features/admin/config-actions";

export const dynamic = "force-dynamic";

const input =
  "rounded-md border border-neutral-300 px-2 py-1 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900";
const btn =
  "rounded-md border border-neutral-300 px-2 py-1 text-xs transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800";
const btnDark =
  "rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900";

export default async function ConfigPage() {
  const [config, zonas] = await Promise.all([
    getConfigLojaAdmin(),
    getZonas(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Configuração</h1>

      {/* Pausar pedidos */}
      <section
        className={`flex items-center justify-between rounded-lg border p-4 ${
          config.pausado
            ? "border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950"
            : "border-neutral-200 dark:border-neutral-800"
        }`}
      >
        <div>
          <p className="font-medium">
            {config.pausado ? "Loja pausada" : "Loja recebendo pedidos"}
          </p>
          <p className="text-sm text-neutral-500">
            {config.pausado
              ? "Os clientes não conseguem finalizar pedidos."
              : "Pause para interromper novos pedidos imediatamente."}
          </p>
        </div>
        <form action={togglePausado}>
          <button className={btnDark} type="submit">
            {config.pausado ? "Retomar" : "Pausar"}
          </button>
        </form>
      </section>

      {/* Dados da loja + taxa */}
      <form
        action={salvarConfigLoja}
        className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
      >
        <h2 className="font-semibold">Loja & entrega</h2>
        <label className="flex flex-col gap-1 text-sm">
          Nome da loja
          <input
            name="nomeLoja"
            defaultValue={config.nomeLoja ?? ""}
            className={input}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Tipo de taxa de entrega
          <select name="tipoTaxa" defaultValue={config.tipoTaxa} className={input}>
            <option value="FIXA">Fixa</option>
            <option value="POR_BAIRRO">Por bairro</option>
          </select>
        </label>
        <div className="flex gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Taxa fixa (R$)
            <input
              name="taxaFixa"
              defaultValue={config.taxaFixa ?? ""}
              inputMode="decimal"
              className={`${input} w-28`}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Pedido mínimo (R$)
            <input
              name="pedidoMinimo"
              defaultValue={config.pedidoMinimo ?? ""}
              inputMode="decimal"
              className={`${input} w-28`}
            />
          </label>
        </div>
        <p className="text-xs text-neutral-400">
          A taxa fixa vale quando o tipo é “Fixa”. Para “Por bairro”, use as zonas
          abaixo.
        </p>
        <button className={`${btnDark} self-start`} type="submit">
          Salvar
        </button>
      </form>

      {/* Zonas de entrega */}
      <section className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="font-semibold">Zonas de entrega (por bairro)</h2>
        {zonas.length === 0 ? (
          <p className="text-sm text-neutral-400">Nenhuma zona cadastrada.</p>
        ) : (
          zonas.map((z) => (
            <div key={z.id} className="flex flex-wrap items-center gap-2">
              <form action={editarZona} className="flex items-center gap-2">
                <input type="hidden" name="id" value={z.id} />
                <input
                  name="bairro"
                  defaultValue={z.bairro}
                  className={input}
                />
                <input
                  name="taxa"
                  defaultValue={z.taxa}
                  inputMode="decimal"
                  className={`${input} w-20`}
                  title="taxa (R$)"
                />
                <input
                  name="tempoEstimado"
                  defaultValue={z.tempoEstimado ?? ""}
                  inputMode="numeric"
                  className={`${input} w-20`}
                  title="tempo (min)"
                  placeholder="min"
                />
                <button className={btn} type="submit">
                  Salvar
                </button>
              </form>
              {!z.ativo ? (
                <span className="text-xs text-neutral-500">(inativa)</span>
              ) : null}
              <form action={toggleZonaAtivo}>
                <input type="hidden" name="id" value={z.id} />
                <button className={btn} type="submit">
                  {z.ativo ? "Desativar" : "Ativar"}
                </button>
              </form>
              <form action={excluirZona}>
                <input type="hidden" name="id" value={z.id} />
                <button className={`${btn} text-red-600`} type="submit">
                  Excluir
                </button>
              </form>
            </div>
          ))
        )}

        <form
          action={criarZona}
          className="flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-3 dark:border-neutral-800"
        >
          <input name="bairro" placeholder="Bairro" className={input} required />
          <input
            name="taxa"
            placeholder="Taxa R$"
            inputMode="decimal"
            className={`${input} w-24`}
            required
          />
          <input
            name="tempoEstimado"
            placeholder="min"
            inputMode="numeric"
            className={`${input} w-20`}
          />
          <button className={btnDark} type="submit">
            Adicionar zona
          </button>
        </form>
      </section>
    </div>
  );
}
