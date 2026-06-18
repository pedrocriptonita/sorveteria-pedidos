"use client";

import { useState } from "react";
import { ListaProdutos } from "./lista-produtos";
import type { LayoutCategoria, SubcategoriaView } from "../types";

/**
 * Subcategoria recolhível (acordeão): mostra o título e os produtos. Começa
 * aberta por padrão; o cliente pode recolher clicando no título.
 */
export function SubcategoriaCollapsible({
  subcategoria,
  layout,
  defaultAberta = true,
}: {
  subcategoria: SubcategoriaView;
  layout: LayoutCategoria;
  defaultAberta?: boolean;
}) {
  const [aberta, setAberta] = useState(defaultAberta);
  const conteudoId = `sub-${subcategoria.id}`;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setAberta((v) => !v)}
        aria-expanded={aberta}
        aria-controls={conteudoId}
        className="flex items-center justify-between gap-2 px-4 py-4 text-left"
      >
        <span className="flex items-center gap-2.5 text-base font-bold text-foreground">
          {subcategoria.nome}
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-sm font-medium text-secondary-foreground">
            {subcategoria.produtos.length}
          </span>
        </span>
        <span
          className={`material-symbols-outlined text-[26px] text-muted-foreground transition-transform duration-200 ${
            aberta ? "rotate-180" : ""
          }`}
          aria-hidden
        >
          expand_more
        </span>
      </button>

      {aberta ? (
        <div id={conteudoId} className="px-3 pb-3">
          <ListaProdutos produtos={subcategoria.produtos} layout={layout} />
        </div>
      ) : null}
    </div>
  );
}
