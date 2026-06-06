import { ProdutoCard } from "./produto-card";
import { ProdutoLinha } from "./produto-linha";
import type { LayoutCategoria, ProdutoView } from "../types";

/**
 * Renderiza uma lista de produtos no layout da categoria:
 *  - GRADE: grade vertical de 2 colunas (um abaixo do outro);
 *  - SCROLL: fileira única com rolagem horizontal.
 *
 * Sem hooks/server-only: pode ser usado tanto em Server quanto Client Components.
 */
export function ListaProdutos({
  produtos,
  layout,
  priorityFirst = false,
}: {
  produtos: ProdutoView[];
  layout: LayoutCategoria;
  /** Marca a 1ª imagem como prioritária (LCP) quando a lista está acima da dobra. */
  priorityFirst?: boolean;
}) {
  if (layout === "GRADE") {
    return (
      <div className="flex flex-col gap-2">
        {produtos.map((produto, i) => (
          <ProdutoLinha
            key={produto.id}
            produto={produto}
            priority={priorityFirst && i === 0}
          />
        ))}
      </div>
    );
  }
  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 no-scrollbar">
      {produtos.map((produto, i) => (
        <div key={produto.id} className="w-36 shrink-0 snap-start sm:w-40">
          <ProdutoCard produto={produto} priority={priorityFirst && i === 0} />
        </div>
      ))}
    </div>
  );
}
