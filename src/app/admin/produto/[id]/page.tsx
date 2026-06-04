import Link from "next/link";
import { notFound } from "next/navigation";
import { getProdutoAdmin } from "@/features/admin/data";
import { FotoUpload } from "@/features/admin/components/foto-upload";
import {
  criarGrupo,
  criarItem,
  criarTamanho,
  editarGrupo,
  editarItem,
  editarProduto,
  editarTamanho,
  excluirGrupo,
  excluirItem,
  excluirProduto,
  excluirTamanho,
  preencherSabores,
  toggleItemDisponivel,
  toggleProdutoDisponivel,
} from "@/features/admin/actions";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/format";

export const dynamic = "force-dynamic";

const input =
  "rounded-md border border-neutral-300 px-2 py-1 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900";
const btn =
  "rounded-md border border-neutral-300 px-2 py-1 text-xs transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800";
const btnDark =
  "rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900";

export default async function ProdutoEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const produto = await getProdutoAdmin(id);
  if (!produto) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/catalogo"
        className="text-sm text-neutral-500 underline underline-offset-2"
      >
        ← Voltar ao catálogo
      </Link>

      <header className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{produto.nome}</h1>
        <div className="flex items-center gap-1">
          <form action={toggleProdutoDisponivel}>
            <input type="hidden" name="id" value={produto.id} />
            <button className={btn} type="submit">
              {produto.disponivel ? "Marcar esgotado" : "Disponibilizar"}
            </button>
          </form>
          <form action={excluirProduto}>
            <input type="hidden" name="id" value={produto.id} />
            <button className={`${btn} text-red-600`} type="submit">
              Excluir produto
            </button>
          </form>
        </div>
      </header>

      {/* Dados básicos */}
      <form
        action={editarProduto}
        className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
      >
        <input type="hidden" name="id" value={produto.id} />
        <label className="flex flex-col gap-1 text-sm">
          Nome
          <input name="nome" defaultValue={produto.nome} className={input} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Descrição
          <input
            name="descricao"
            defaultValue={produto.descricao ?? ""}
            className={input}
          />
        </label>
        {!produto.montavel ? (
          <label className="flex flex-col gap-1 text-sm">
            Preço
            <input
              name="preco"
              defaultValue={produto.preco ?? ""}
              inputMode="decimal"
              className={`${input} w-28`}
            />
          </label>
        ) : null}
        <button className={`${btnDark} self-start`} type="submit">
          Salvar
        </button>
      </form>

      {/* Upload de foto */}
      <FotoUpload produtoId={produto.id} fotoAtual={produto.foto ?? null} />

      {produto.montavel ? (
        <>
          {/* TAMANHOS */}
          <section className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
            <h2 className="font-semibold">Tamanhos</h2>
            {produto.tamanhos.length === 0 ? (
              <p className="text-sm text-neutral-400">Nenhum tamanho ainda.</p>
            ) : (
              produto.tamanhos.map((t) => (
                <div key={t.id} className="flex items-center gap-2">
                  <form action={editarTamanho} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="produtoId" value={produto.id} />
                    <input name="nome" defaultValue={t.nome} className={input} />
                    <input
                      name="precoBase"
                      defaultValue={t.precoBase}
                      inputMode="decimal"
                      className={`${input} w-24`}
                    />
                    <button className={btn} type="submit">
                      Salvar
                    </button>
                  </form>
                  <form action={excluirTamanho}>
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="produtoId" value={produto.id} />
                    <button className={`${btn} text-red-600`} type="submit">
                      Remover
                    </button>
                  </form>
                </div>
              ))
            )}
            <form
              action={criarTamanho}
              className="flex items-center gap-2 border-t border-neutral-100 pt-3 dark:border-neutral-800"
            >
              <input type="hidden" name="produtoId" value={produto.id} />
              <input name="nome" placeholder="Tamanho (ex.: 500ml)" className={input} required />
              <input
                name="precoBase"
                placeholder="Preço base"
                inputMode="decimal"
                className={`${input} w-24`}
                required
              />
              <button className={btnDark} type="submit">
                Adicionar
              </button>
            </form>
          </section>

          {/* GRUPOS DE OPÇÕES */}
          <section className="flex flex-col gap-4">
            <h2 className="font-semibold">Grupos de opções</h2>
            {produto.grupos.map((g) => (
              <div
                key={g.id}
                className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
              >
                <form action={editarGrupo} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="id" value={g.id} />
                  <input type="hidden" name="produtoId" value={produto.id} />
                  <label className="flex flex-col gap-1 text-xs text-neutral-500">
                    Nome
                    <input name="nome" defaultValue={g.nome} className={input} />
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-neutral-500">
                    Tipo
                    <select name="tipo" defaultValue={g.tipo} className={input}>
                      <option value="UNICO">Único</option>
                      <option value="MULTIPLO">Múltiplo</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-neutral-500">
                    Mín
                    <input
                      name="min"
                      type="number"
                      min={0}
                      defaultValue={g.min}
                      className={`${input} w-16`}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-neutral-500">
                    Máx
                    <input
                      name="max"
                      type="number"
                      min={0}
                      defaultValue={g.max ?? ""}
                      className={`${input} w-16`}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-neutral-500">
                    Cota grátis
                    <input
                      name="cotaGratis"
                      type="number"
                      min={0}
                      defaultValue={g.cotaGratis}
                      className={`${input} w-20`}
                    />
                  </label>
                  <label className="flex items-center gap-1 text-xs text-neutral-500">
                    <input
                      type="checkbox"
                      name="obrigatorio"
                      defaultChecked={g.obrigatorio}
                    />
                    obrigatório
                  </label>
                  <button className={btn} type="submit">
                    Salvar grupo
                  </button>
                </form>

                {/* Itens do grupo */}
                <ul className="flex flex-col gap-1 border-t border-neutral-100 pt-2 dark:border-neutral-800">
                  {g.itens.map((it) => (
                    <li key={it.id} className="flex flex-wrap items-center gap-2 text-sm">
                      {/* Edição inline de nome + sobrepreço */}
                      <form action={editarItem} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={it.id} />
                        <input type="hidden" name="produtoId" value={produto.id} />
                        <input
                          name="nome"
                          defaultValue={it.nome}
                          className={`${input} w-36`}
                        />
                        <input
                          name="precoExtra"
                          defaultValue={it.precoExtra > 0 ? it.precoExtra : ""}
                          placeholder="+ R$"
                          inputMode="decimal"
                          className={`${input} w-20`}
                        />
                        <button className={btn} type="submit">
                          Salvar
                        </button>
                      </form>
                      {!it.disponivel ? (
                        <span className="text-xs text-amber-600">(esgotado)</span>
                      ) : null}
                      <div className="ml-auto flex items-center gap-1">
                        <form action={toggleItemDisponivel}>
                          <input type="hidden" name="id" value={it.id} />
                          <input type="hidden" name="produtoId" value={produto.id} />
                          <button className={btn} type="submit">
                            {it.disponivel ? "Esgotar" : "Disponibilizar"}
                          </button>
                        </form>
                        <form action={excluirItem}>
                          <input type="hidden" name="id" value={it.id} />
                          <input type="hidden" name="produtoId" value={produto.id} />
                          <button className={`${btn} text-red-600`} type="submit">
                            Remover
                          </button>
                        </form>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Atalho: preencher o grupo com os sabores padrão */}
                <form action={preencherSabores}>
                  <input type="hidden" name="grupoId" value={g.id} />
                  <input type="hidden" name="produtoId" value={produto.id} />
                  <Button
                    type="submit"
                    variant="secondary"
                    size="sm"
                    className="gap-1.5"
                  >
                    🍦 Preencher com Sabores de Sorvete
                  </Button>
                </form>

                {/* Novo item + excluir grupo (forms irmãos — sem aninhar) */}
                <div className="flex items-center gap-2">
                  <form action={criarItem} className="flex items-center gap-2">
                    <input type="hidden" name="grupoId" value={g.id} />
                    <input type="hidden" name="produtoId" value={produto.id} />
                    <input name="nome" placeholder="Nova opção" className={input} required />
                    <input
                      name="precoExtra"
                      placeholder="+ R$"
                      inputMode="decimal"
                      className={`${input} w-20`}
                    />
                    <button className={btn} type="submit">
                      Adicionar opção
                    </button>
                  </form>
                  <form action={excluirGrupo} className="ml-auto">
                    <input type="hidden" name="id" value={g.id} />
                    <input type="hidden" name="produtoId" value={produto.id} />
                    <button className={`${btn} text-red-600`} type="submit">
                      Excluir grupo
                    </button>
                  </form>
                </div>
              </div>
            ))}

            {/* Novo grupo */}
            <form
              action={criarGrupo}
              className="flex flex-wrap items-end gap-2 rounded-lg border border-dashed border-neutral-300 p-4 dark:border-neutral-700"
            >
              <input type="hidden" name="produtoId" value={produto.id} />
              <input name="nome" placeholder="Novo grupo (ex.: Acompanhamentos)" className={input} required />
              <select name="tipo" defaultValue="MULTIPLO" className={input}>
                <option value="UNICO">Único</option>
                <option value="MULTIPLO">Múltiplo</option>
              </select>
              <input name="min" type="number" min={0} defaultValue={0} className={`${input} w-16`} title="mínimo" />
              <input name="max" type="number" min={0} placeholder="máx" className={`${input} w-16`} />
              <input name="cotaGratis" type="number" min={0} defaultValue={0} className={`${input} w-20`} title="cota grátis" />
              <label className="flex items-center gap-1 text-xs text-neutral-500">
                <input type="checkbox" name="obrigatorio" /> obrigatório
              </label>
              <button className={btnDark} type="submit">
                Criar grupo
              </button>
            </form>
          </section>
        </>
      ) : null}
    </div>
  );
}
