import { getCardapio } from "@/features/catalogo/data";
import { ProdutoCard } from "@/features/catalogo/components/produto-card";

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
      {/* Pills de categoria — scroll horizontal */}
      <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
        <div className="flex gap-3 w-max pb-1 pt-1">
          {cardapio.map((cat, idx) => (
            <a
              key={cat.id}
              href={`#cat-${cat.id}`}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                idx === 0
                  ? "bg-primary text-white shadow-sm"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {cat.nome}
            </a>
          ))}
        </div>
      </div>

      {/* Seções por categoria */}
      {cardapio.map((categoria) => (
        <section key={categoria.id} id={`cat-${categoria.id}`} className="flex flex-col gap-3 scroll-mt-20">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <span className="w-1 h-5 rounded-full bg-primary" aria-hidden />
            {categoria.nome}
          </h2>

          {/* Fileira única — scroll horizontal (esquerda ↔ direita) */}
          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 no-scrollbar">
            {categoria.produtos.map((produto) => (
              <div key={produto.id} className="w-36 shrink-0 snap-start sm:w-40">
                <ProdutoCard produto={produto} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
