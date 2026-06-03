"use client";

import Link from "next/link";
import { useCart } from "../cart/cart-provider";
import type { ProdutoView } from "../types";
import { formatBRL } from "@/lib/format";

function precoBaseMontavel(produto: ProdutoView): number {
  if (produto.tamanhos.length === 0) return 0;
  return Math.min(...produto.tamanhos.map((t) => t.precoBase));
}

export function ProdutoCard({ produto }: { produto: ProdutoView }) {
  const { adicionar } = useCart();
  const indisponivel = !produto.disponivel;

  function adicionarSimples() {
    adicionar({
      produtoId: produto.id,
      nomeProduto: produto.nome,
      montavel: false,
      tamanhoNome: null,
      opcoesResumo: [],
      quantidade: 1,
      precoUnitario: produto.preco ?? 0,
      config: { tamanhoId: null, selecoes: {} },
    });
  }

  return (
    <div className="flex gap-3 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
      <div
        aria-hidden
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-2xl dark:bg-neutral-800"
      >
        🍧
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium">{produto.nome}</h3>
          {indisponivel ? (
            <span className="shrink-0 rounded bg-neutral-200 px-1.5 py-0.5 text-xs text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
              Indisponível
            </span>
          ) : null}
        </div>

        {produto.descricao ? (
          <p className="line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
            {produto.descricao}
          </p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="text-sm font-semibold">
            {produto.montavel
              ? `a partir de ${formatBRL(precoBaseMontavel(produto))}`
              : formatBRL(produto.preco ?? 0)}
          </span>

          {indisponivel ? null : produto.montavel ? (
            <Link
              href={`/produto/${produto.id}`}
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              Montar
            </Link>
          ) : (
            <button
              type="button"
              onClick={adicionarSimples}
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              Adicionar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
