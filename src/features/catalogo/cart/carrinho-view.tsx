"use client";

import Link from "next/link";
import { useCart } from "./cart-provider";
import { formatBRL } from "@/lib/format";

/**
 * UI do carrinho. Recebe o pedido mínimo da loja (server) e BLOQUEIA o avanço
 * para o checkout enquanto o subtotal estiver abaixo dele — evita o cliente
 * preencher todo o checkout só para descobrir o mínimo no fim.
 */
export function CarrinhoView({ pedidoMinimo }: { pedidoMinimo: number | null }) {
  const { itens, subtotal, alterarQuantidade, remover, limpar, pronto } =
    useCart();

  if (!pronto) {
    return <p className="py-16 text-center text-neutral-500">Carregando…</p>;
  }

  if (itens.length === 0) {
    return (
      <div className="py-16 text-center text-neutral-500">
        <p className="text-lg font-medium">Seu carrinho está vazio 🛒</p>
        <Link
          href="/"
          className="mt-2 inline-block text-sm underline underline-offset-2"
        >
          Ver o cardápio
        </Link>
      </div>
    );
  }

  const abaixoDoMinimo = pedidoMinimo !== null && subtotal < pedidoMinimo;
  const faltam = pedidoMinimo !== null ? pedidoMinimo - subtotal : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Carrinho</h1>
        <button
          type="button"
          onClick={limpar}
          className="text-sm text-neutral-500 underline underline-offset-2"
        >
          Limpar
        </button>
      </div>

      <ul className="flex flex-col gap-3">
        {itens.map((item) => (
          <li
            key={item.linhaId}
            className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium">{item.nomeProduto}</p>
                {item.tamanhoNome ? (
                  <p className="text-sm text-neutral-500">{item.tamanhoNome}</p>
                ) : null}
                {item.opcoesResumo.map((op) => (
                  <p key={op.grupoNome} className="text-xs text-neutral-500">
                    <span className="font-medium">{op.grupoNome}:</span>{" "}
                    {op.itens.join(", ")}
                  </p>
                ))}
              </div>
              <button
                type="button"
                onClick={() => remover(item.linhaId)}
                className="shrink-0 text-sm text-red-600 underline underline-offset-2"
              >
                Remover
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    alterarQuantidade(item.linhaId, item.quantidade - 1)
                  }
                  className="h-7 w-7 rounded-md border border-neutral-300 dark:border-neutral-700"
                  aria-label="Diminuir"
                >
                  −
                </button>
                <span className="w-6 text-center text-sm">
                  {item.quantidade}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    alterarQuantidade(item.linhaId, item.quantidade + 1)
                  }
                  className="h-7 w-7 rounded-md border border-neutral-300 dark:border-neutral-700"
                  aria-label="Aumentar"
                >
                  +
                </button>
              </div>
              <span className="text-sm font-semibold">
                {formatBRL(item.precoUnitario * item.quantidade)}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <div className="sticky bottom-0 flex flex-col gap-3 border-t border-neutral-200 bg-background pt-4 dark:border-neutral-800">
        <div className="flex items-center justify-between text-lg font-bold">
          <span>Subtotal</span>
          <span>{formatBRL(subtotal)}</span>
        </div>

        {abaixoDoMinimo ? (
          <>
            <p className="rounded-md bg-amber-100 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
              Pedido mínimo de {formatBRL(pedidoMinimo!)}. Faltam{" "}
              {formatBRL(faltam)} para finalizar.
            </p>
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-md bg-neutral-900 px-4 py-3 text-center text-sm font-medium text-white opacity-50 dark:bg-white dark:text-neutral-900"
            >
              Finalizar pedido
            </button>
          </>
        ) : (
          <Link
            href="/checkout"
            className="rounded-md bg-neutral-900 px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            Finalizar pedido
          </Link>
        )}
      </div>
    </div>
  );
}
