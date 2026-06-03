import Link from "next/link";
import { getCategoriasComProdutos } from "@/features/admin/data";
import {
  criarCategoria,
  criarProduto,
  excluirCategoria,
  excluirProduto,
  moverCategoria,
  renomearCategoria,
  toggleCategoriaAtivo,
  toggleProdutoDisponivel,
} from "@/features/admin/actions";
import { formatBRL } from "@/lib/format";

export const dynamic = "force-dynamic";

const input =
  "rounded-md border border-neutral-300 px-2 py-1 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900";
const btn =
  "rounded-md border border-neutral-300 px-2 py-1 text-xs transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800";
const btnDark =
  "rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900";

export default async function CatalogoAdminPage() {
  const categorias = await getCategoriasComProdutos();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Catálogo</h1>

      {categorias.map((cat, idx) => (
        <section
          key={cat.id}
          className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <form action={renomearCategoria} className="flex items-center gap-2">
              <input type="hidden" name="id" value={cat.id} />
              <input
                name="nome"
                defaultValue={cat.nome}
                className={`${input} font-semibold`}
              />
              <button className={btn} type="submit">
                Salvar
              </button>
              {!cat.ativo ? (
                <span className="rounded bg-neutral-200 px-1.5 py-0.5 text-xs text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
                  inativa
                </span>
              ) : null}
            </form>

            <div className="flex items-center gap-1">
              <form action={moverCategoria}>
                <input type="hidden" name="id" value={cat.id} />
                <input type="hidden" name="dir" value="cima" />
                <button className={btn} type="submit" disabled={idx === 0}>
                  ↑
                </button>
              </form>
              <form action={moverCategoria}>
                <input type="hidden" name="id" value={cat.id} />
                <input type="hidden" name="dir" value="baixo" />
                <button
                  className={btn}
                  type="submit"
                  disabled={idx === categorias.length - 1}
                >
                  ↓
                </button>
              </form>
              <form action={toggleCategoriaAtivo}>
                <input type="hidden" name="id" value={cat.id} />
                <button className={btn} type="submit">
                  {cat.ativo ? "Desativar" : "Ativar"}
                </button>
              </form>
              <form action={excluirCategoria}>
                <input type="hidden" name="id" value={cat.id} />
                <button
                  className={`${btn} text-red-600`}
                  type="submit"
                >
                  Excluir
                </button>
              </form>
            </div>
          </div>

          {/* Produtos da categoria */}
          <ul className="flex flex-col divide-y divide-neutral-100 dark:divide-neutral-800">
            {cat.produtos.length === 0 ? (
              <li className="py-2 text-sm text-neutral-400">
                Nenhum produto nesta categoria.
              </li>
            ) : (
              cat.produtos.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{p.nome}</span>
                    {p.montavel ? (
                      <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-500 dark:bg-neutral-800">
                        montável
                      </span>
                    ) : (
                      <span className="text-neutral-500">
                        {formatBRL(p.preco ?? 0)}
                      </span>
                    )}
                    {!p.disponivel ? (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                        esgotado
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1">
                    <form action={toggleProdutoDisponivel}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className={btn} type="submit">
                        {p.disponivel ? "Marcar esgotado" : "Disponibilizar"}
                      </button>
                    </form>
                    <Link href={`/admin/produto/${p.id}`} className={btn}>
                      Editar
                    </Link>
                    <form action={excluirProduto}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className={`${btn} text-red-600`} type="submit">
                        Excluir
                      </button>
                    </form>
                  </div>
                </li>
              ))
            )}
          </ul>

          {/* Novo produto */}
          <form
            action={criarProduto}
            className="flex flex-wrap items-end gap-2 border-t border-neutral-100 pt-3 dark:border-neutral-800"
          >
            <input type="hidden" name="categoriaId" value={cat.id} />
            <input name="nome" placeholder="Novo produto" className={input} required />
            <input
              name="preco"
              placeholder="Preço"
              inputMode="decimal"
              className={`${input} w-20`}
            />
            <label className="flex items-center gap-1 text-xs text-neutral-500">
              <input type="checkbox" name="montavel" /> montável
            </label>
            <button className={btnDark} type="submit">
              Adicionar
            </button>
          </form>
          <p className="text-xs text-neutral-400">
            Montável: deixe o preço em branco e configure tamanhos/opções no
            editor.
          </p>
        </section>
      ))}

      {/* Nova categoria */}
      <form
        action={criarCategoria}
        className="flex items-center gap-2 rounded-lg border border-dashed border-neutral-300 p-4 dark:border-neutral-700"
      >
        <input name="nome" placeholder="Nova categoria" className={input} required />
        <button className={btnDark} type="submit">
          Criar categoria
        </button>
      </form>
    </div>
  );
}
