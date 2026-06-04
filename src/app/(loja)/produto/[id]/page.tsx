import { notFound } from "next/navigation";
import { getProduto } from "@/features/catalogo/data";
import { MontagemForm } from "@/features/catalogo/components/montagem-form";
import { SetProdutoHero } from "@/features/catalogo/components/set-produto-hero";

export const dynamic = "force-dynamic";

export default async function ProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const produto = await getProduto(id);

  if (!produto || !produto.disponivel) notFound();

  return (
    <div className="flex flex-col gap-6">
      {/* Publica a foto/nome no Hero; o botão de voltar fica no header */}
      <SetProdutoHero foto={produto.foto} nome={produto.nome} />

      {produto.descricao ? (
        <p className="text-neutral-600 dark:text-neutral-400">
          {produto.descricao}
        </p>
      ) : null}

      <MontagemForm produto={produto} />
    </div>
  );
}
