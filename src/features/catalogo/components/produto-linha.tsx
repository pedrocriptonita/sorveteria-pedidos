"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "../cart/cart-provider";
import type { ProdutoView } from "../types";
import { formatBRL } from "@/lib/format";

function precoBaseMontavel(produto: ProdutoView): number {
  if (produto.tamanhos.length === 0) return 0;
  return Math.min(...produto.tamanhos.map((t) => t.precoBase));
}

/**
 * Cartão do produto em formato de LINHA compacto (foto pequena à esquerda,
 * nome/preço no meio, botão "+" à direita). Usado no layout GRADE — bom para
 * categorias com muitos itens (ex.: linhas de picolé).
 */
export function ProdutoLinha({
  produto,
  priority = false,
}: {
  produto: ProdutoView;
  /** true para a primeira linha acima da dobra (melhora o LCP). */
  priority?: boolean;
}) {
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
    <div
      className={`flex items-center gap-3 rounded-xl bg-white p-2 shadow-[0px_2px_10px_rgba(0,0,0,0.05)] ${
        indisponivel ? "opacity-60" : ""
      }`}
    >
      {/* Foto */}
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#fdf1f0]">
        {produto.foto ? (
          <Image
            src={produto.foto}
            alt={produto.nome}
            fill
            priority={priority}
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl">
            🍧
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-foreground">
          {produto.nome}
        </h3>
        <span className="text-sm font-bold text-primary">
          {produto.montavel
            ? `a partir de ${formatBRL(precoBaseMontavel(produto))}`
            : formatBRL(produto.preco ?? 0)}
        </span>
        {indisponivel ? (
          <span className="text-xs font-medium text-muted-foreground">
            Esgotado
          </span>
        ) : null}
      </div>

      {/* Ação */}
      {indisponivel ? null : produto.montavel ? (
        <Link
          href={`/produto/${produto.id}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-md transition-all hover:bg-primary/90 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label={`Montar ${produto.nome}`}
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
        </Link>
      ) : (
        <button
          type="button"
          onClick={adicionarSimples}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-md transition-all hover:bg-primary/90 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label={`Adicionar ${produto.nome}`}
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
        </button>
      )}
    </div>
  );
}
