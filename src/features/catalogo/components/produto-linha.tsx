"use client";

import Link from "next/link";
import Image from "next/image";
import type { ProdutoView } from "../types";
import { formatBRL } from "@/lib/format";

function precoBaseMontavel(produto: ProdutoView): number {
  if (produto.tamanhos.length === 0) return 0;
  return Math.min(...produto.tamanhos.map((t) => t.precoBase));
}

/**
 * Produto em formato de LINHA compacto (layout GRADE). A linha inteira é
 * clicável e leva à página do produto, onde o cliente adiciona ao carrinho.
 */
export function ProdutoLinha({
  produto,
  priority = false,
}: {
  produto: ProdutoView;
  /** true para a primeira linha acima da dobra (melhora o LCP). */
  priority?: boolean;
}) {
  const indisponivel = !produto.disponivel;

  const conteudo = (
    <>
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

      {/* Indicador de que abre a página do produto */}
      {indisponivel ? null : (
        <span
          className="material-symbols-outlined shrink-0 text-muted-foreground"
          aria-hidden
        >
          chevron_right
        </span>
      )}
    </>
  );

  const base =
    "flex items-center gap-3 rounded-xl bg-white p-2 shadow-[0px_2px_10px_rgba(0,0,0,0.05)]";

  if (indisponivel) {
    return <div className={`${base} opacity-60`}>{conteudo}</div>;
  }

  return (
    <Link
      href={`/produto/${produto.id}`}
      aria-label={`Ver ${produto.nome}`}
      className={`${base} transition-transform active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-primary`}
    >
      {conteudo}
    </Link>
  );
}
