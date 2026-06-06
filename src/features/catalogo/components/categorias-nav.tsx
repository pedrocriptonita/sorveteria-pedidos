"use client";

import { useEffect, useRef, useState } from "react";

interface CategoriaNavItem {
  id: string;
  nome: string;
}

/**
 * Barra de categorias FIXA logo abaixo do header (mesmo padrão do header e do
 * bottom-nav, ambos `fixed`). Evitamos `sticky` porque, sendo filha de um
 * container flex dentro do <main>, ela não gruda de forma confiável no mobile.
 *
 * Um espaçador em fluxo (mesma altura) reserva o espaço, já que a barra fixa
 * sai do fluxo. O scroll-spy usa um listener de scroll (mais robusto no mobile
 * que IntersectionObserver com rootMargin) para destacar a seção visível.
 *
 * As seções são renderizadas no servidor com id `cat-<id>` (ver page.tsx).
 */
export function CategoriasNav({
  categorias,
}: {
  categorias: CategoriaNavItem[];
}) {
  const [ativo, setAtivo] = useState<string | null>(categorias[0]?.id ?? null);
  const navRef = useRef<HTMLDivElement>(null);
  const pillsRef = useRef<HTMLDivElement>(null);

  // Scroll-spy: ao rolar, a categoria ativa é a última seção cujo topo já
  // passou pela linha de base da barra (parte de baixo da barra fixa).
  useEffect(() => {
    if (categorias.length === 0) return;

    function aoRolar() {
      const linha = (navRef.current?.getBoundingClientRect().bottom ?? 160) + 8;
      let atual = categorias[0]?.id ?? null;
      for (const c of categorias) {
        const el = document.getElementById(`cat-${c.id}`);
        if (el && el.getBoundingClientRect().top <= linha) atual = c.id;
      }
      setAtivo((prev) => (prev === atual ? prev : atual));
    }

    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("resize", aoRolar);
    return () => {
      window.removeEventListener("scroll", aoRolar);
      window.removeEventListener("resize", aoRolar);
    };
  }, [categorias]);

  // Mantém a pill ativa centralizada — SÓ no eixo horizontal da própria barra.
  useEffect(() => {
    const container = pillsRef.current;
    if (!ativo || !container) return;
    const pill = container.querySelector<HTMLElement>(`[data-cat="${ativo}"]`);
    if (!pill) return;
    const c = container.getBoundingClientRect();
    const p = pill.getBoundingClientRect();
    const delta = p.left + p.width / 2 - (c.left + c.width / 2);
    container.scrollBy({ left: delta, behavior: "smooth" });
  }, [ativo]);

  if (categorias.length === 0) return null;

  function aoClicar(id: string) {
    setAtivo(id);
    document
      .getElementById(`cat-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      {/* Espaçador em fluxo: reserva o espaço da barra fixa. */}
      <div aria-hidden className="h-[52px]" />
      <div
        ref={navRef}
        className="fixed inset-x-0 top-28 z-40 h-[52px] border-b border-border bg-background shadow-[0_4px_12px_rgba(0,0,0,0.06)] sm:top-32 md:top-36"
      >
        <div className="mx-auto flex h-full max-w-md items-center px-4">
          <div
            ref={pillsRef}
            className="no-scrollbar flex gap-3 overflow-x-auto"
          >
            {categorias.map((cat) => {
              const isAtivo = cat.id === ativo;
              return (
                <button
                  key={cat.id}
                  type="button"
                  data-cat={cat.id}
                  onClick={() => aoClicar(cat.id)}
                  className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                    isAtivo
                      ? "bg-primary text-white shadow-sm"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {cat.nome}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
