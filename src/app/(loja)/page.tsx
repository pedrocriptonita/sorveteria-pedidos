import { getCardapio } from "@/features/catalogo/data";
import { ProdutoCard } from "@/features/catalogo/components/produto-card";

// Cardápio lê o banco a cada requisição (disponibilidade muda em tempo real).
export const dynamic = "force-dynamic";

export default async function CardapioPage() {
  const cardapio = await getCardapio();

  if (cardapio.length === 0) {
    return (
      <div className="py-16 text-center text-neutral-500">
        <p className="text-lg font-medium">Cardápio em preparação 🍦</p>
        <p className="mt-1 text-sm">
          Rode <code className="font-mono">npm run db:seed</code> para ver dados
          de exemplo.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {cardapio.map((categoria) => (
        <section key={categoria.id} className="flex flex-col gap-3">
          <h2 className="text-xl font-bold">{categoria.nome}</h2>
          <div className="flex flex-col gap-3">
            {categoria.produtos.map((produto) => (
              <ProdutoCard key={produto.id} produto={produto} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
