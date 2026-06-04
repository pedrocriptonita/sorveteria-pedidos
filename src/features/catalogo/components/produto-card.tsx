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

function FotoPlaceholder() {
  return (
    <div className="w-full h-full flex items-center justify-center text-5xl">
      🍧
    </div>
  );
}

export function ProdutoCard({
  produto,
  priority = false,
}: {
  produto: ProdutoView;
  /** true para o primeiro card acima da dobra (melhora o LCP). */
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
      className={`bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.06)] relative flex flex-col transition-transform active:scale-[0.98] ${
        indisponivel ? "opacity-60" : ""
      }`}
    >
      {/* Área da foto */}
      <div className="relative aspect-square rounded-t-xl overflow-hidden bg-[#fdf1f0]">
        {produto.foto ? (
          <Image
            src={produto.foto}
            alt={produto.nome}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 200px"
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

      {/* Botão + circular */}
      {indisponivel ? null : produto.montavel ? (
        <Link
          href={`/produto/${produto.id}`}
          className="absolute bottom-3 right-3 w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center shadow-md hover:bg-primary/90 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 z-10"
          aria-label={`Montar ${produto.nome}`}
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
        </Link>
      ) : (
        <button
          type="button"
          onClick={adicionarSimples}
          className="absolute bottom-3 right-3 w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center shadow-md hover:bg-primary/90 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 z-10"
          aria-label={`Adicionar ${produto.nome}`}
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
        </button>
      )}
    </div>
  );
}
