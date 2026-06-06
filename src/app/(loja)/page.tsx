import { getCardapio } from "@/features/catalogo/data";
import { CategoriasNav } from "@/features/catalogo/components/categorias-nav";
import { ListaProdutos } from "@/features/catalogo/components/lista-produtos";
import { SubcategoriaCollapsible } from "@/features/catalogo/components/subcategoria-collapsible";

export const dynamic = "force-dynamic";

export default async function CardapioPage() {
  const cardapio = await getCardapio();

  if (cardapio.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <p className="text-lg font-semibold">Cardápio em preparação 🍦</p>
        <p className="mt-1 text-sm">
          Rode <code className="font-mono text-xs">npm run db:seed</code> para
          ver dados de exemplo.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Barra de categorias fixa (sticky) com scroll-spy */}
      <CategoriasNav
        categorias={cardapio.map((c) => ({ id: c.id, nome: c.nome }))}
      />

      {/* Seções por categoria */}
      {cardapio.map((categoria, idx) => (
        <section
          key={categoria.id}
          id={`cat-${categoria.id}`}
          className="flex flex-col gap-3 scroll-mt-44 sm:scroll-mt-48 md:scroll-mt-52"
        >
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <span className="w-1 h-5 rounded-full bg-primary" aria-hidden />
            {categoria.nome}
          </h2>

          {/* Produtos soltos (sem subcategoria) */}
          {categoria.produtos.length > 0 ? (
            <ListaProdutos
              produtos={categoria.produtos}
              layout={categoria.layout}
              priorityFirst={idx === 0}
            />
          ) : null}

          {/* Subcategorias recolhíveis (ex.: linhas do picolé) */}
          {categoria.subcategorias.map((sub) => (
            <SubcategoriaCollapsible
              key={sub.id}
              subcategoria={sub}
              layout={categoria.layout}
            />
          ))}
        </section>
      ))}
    </div>
  );
}
