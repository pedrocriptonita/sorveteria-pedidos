"use client";

import Link from "next/link";
import Image from "next/image";
import type { ProdutoView } from "../types";
import { formatBRL } from "@/lib/format";

function precoBaseMontavel(produto: ProdutoView): number {
  if (produto.tamanhos.length === 0) return 0;
  return Math.min(...produto.tamanhos.map((t) => t.precoBase));
}

function FotoPlaceholder() {
  return (
    <div className="w-full h-full flex items-center justify-center text-5xl">
      🍧
    </div>
  );
}

/**
 * Card do produto no cardápio. O card INTEIRO é clicável e leva à página do
 * produto, onde o cliente confirma e adiciona ao carrinho — evita o "+" de
 * toque rápido (e o risco de duplicar item sem querer).
 */
export function ProdutoCard({
  produto,
  priority = false,
}: {
  produto: ProdutoView;
  /** true para o primeiro card acima da dobra (melhora o LCP). */
  priority?: boolean;
}) {
  const indisponivel = !produto.disponivel;

  const conteudo = (
    <>
      {/* Área da foto */}
      <div className="relative aspect-square rounded-t-xl overflow-hidden bg-[#fdf1f0]">
        {produto.foto ? (
          <Image
            src={produto.foto}
            alt={produto.nome}
            fill
            priority={priority}
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 200px"
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmRmMWYwIi8+PC9zdmc+"
          />
        ) : (
          <FotoPlaceholder />
        )}
        {indisponivel ? (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="text-xs font-semibold text-muted-foreground bg-white/80 px-2 py-1 rounded-full">
              Esgotado
            </span>
          </div>
        ) : null}
      </div>

      {/* Info */}
      <div className="p-3 pb-4 flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-tight">
          {produto.nome}
        </h3>
        <span className="text-sm font-bold text-primary">
          {produto.montavel
            ? `a partir de ${formatBRL(precoBaseMontavel(produto))}`
            : formatBRL(produto.preco ?? 0)}
        </span>
      </div>
    </>
  );

  const base =
    "bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.06)] relative flex flex-col";

  if (indisponivel) {
    return <div className={`${base} opacity-60`}>{conteudo}</div>;
  }

  return (
    <Link
      href={`/produto/${produto.id}`}
      aria-label={`Ver ${produto.nome}`}
      className={`${base} block transition-transform active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
    >
      {conteudo}
    </Link>
  );
}
