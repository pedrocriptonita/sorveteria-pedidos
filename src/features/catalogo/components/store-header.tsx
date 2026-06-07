"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useCart } from "../cart/cart-provider";
import { useHero } from "./hero-context";

/**
 * Gradiente do Hero conforme o tipo de produto (pela palavra no nome):
 *  - "açaí"   → roxo, lembrando a cor da fruta
 *  - "sorvete" (e padrão) → vermelho médio da marca, que destaca o nome
 * Classes completas e literais para o Tailwind detectar no build.
 */
function gradienteDoProduto(nome: string): string {
  const n = nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  if (n.includes("acai")) {
    return "bg-gradient-to-b from-purple-900/10 via-transparent to-purple-900";
  }
  return "bg-gradient-to-b from-red-600/10 via-transparent to-red-700";
}

export function StoreHeader() {
  const { totalItens, pronto } = useCart();
  const { produtoHero } = useHero();
  const [logoError, setLogoError] = useState(false);

  const modoProduto = produtoHero !== null;

  return (
    <header
      className={`fixed top-0 w-full z-50 bg-primary shadow-md overflow-hidden transition-[height] duration-500 ease-out ${modoProduto ? "h-48 sm:h-52 md:h-60" : "h-28 sm:h-32 md:h-36"
        }`}
    >
      {/* ===== Camada FOTO DO PRODUTO (modo produto) ===== */}
      <div
        className={`absolute inset-0 transition-all duration-500 ease-out ${modoProduto
            ? "opacity-100 scale-100"
            : "pointer-events-none opacity-0 scale-95"
          }`}
      >
        {produtoHero?.foto ? (
          <Image
            src={produtoHero.foto}
            alt={produtoHero.nome}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-6xl">
            🍧
          </div>
        )}
        {/* Gradiente por tipo de produto (roxo p/ açaí, vermelho p/ sorvete) */}
        <div
          className={`absolute inset-0 ${gradienteDoProduto(produtoHero?.nome ?? "")}`}
        />
        {/* Nome do produto sobreposto */}
        <h1 className="absolute bottom-3 left-4 right-4 text-2xl font-extrabold text-primary-foreground drop-shadow-md line-clamp-2">
          {produtoHero?.nome}
        </h1>
      </div>

      {/* ===== Barra de controles (sempre visível, por cima) ===== */}
      <div className="relative z-10 flex h-28 sm:h-32 md:h-36 items-center justify-between px-4">
        {/* Esquerda: ícone da loja (logo) OU voltar (produto) */}
        {modoProduto ? (
          <Link
            href="/"
            aria-label="Voltar ao cardápio"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-primary-foreground backdrop-blur-sm transition-colors hover:bg-black/30 focus:outline-none focus:ring-2 focus:ring-primary-foreground/30"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center text-primary-foreground/80">
            <span className="material-symbols-outlined">icecream</span>
          </div>
        )}

        {/* Centro: logo (some no modo produto) */}
        <Link
          href="/"
          className={`flex items-center justify-center transition-opacity duration-300 ${modoProduto ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
          style={{ perspective: "600px" }}
        >
          {!logoError ? (
            <Image
              src="/logo.svg"
              alt="Qbombom Sorvetes"
              width={163}
              height={82}
              priority
              className="object-contain transition-transform duration-300 hover:scale-105"
              style={{
                height: "60px",
                width: "auto",
                transform: "rotateX(6deg) rotateY(-8deg)",
                filter:
                  "drop-shadow(4px 6px 8px rgba(0,0,0,0.45)) drop-shadow(1px 2px 3px rgba(0,0,0,0.3))",
                transformStyle: "preserve-3d",
              }}
              onError={() => setLogoError(true)}
            />
          ) : (
            <span className="text-2xl font-extrabold text-primary-foreground tracking-tight">
              Qbombom Sorvetes
            </span>
          )}
        </Link>

        {/* Direita: carrinho com badge */}
        <Link
          href="/carrinho"
          className={`relative flex h-10 w-10 items-center justify-center rounded-full text-primary-foreground/80 transition-colors hover:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-primary-foreground/20 ${modoProduto ? "bg-black/20 backdrop-blur-sm" : ""
            }`}
        >
          <span className="material-symbols-outlined">shopping_cart</span>
          {pronto && totalItens > 0 ? (
            <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-primary-foreground border-2 border-primary" />
          ) : null}
        </Link>
      </div>
    </header>
  );
}
