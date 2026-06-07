import { notFound } from "next/navigation";
import { getProduto } from "@/features/catalogo/data";
import { MontagemForm } from "@/features/catalogo/components/montagem-form";
import { SetProdutoHero } from "@/features/catalogo/components/set-produto-hero";
import { formatBRL } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProdutoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ editar?: string }>;
}) {
  const { id } = await params;
  const { editar } = await searchParams;
  const produto = await getProduto(id);

  if (!produto || !produto.disponivel) notFound();

  const precoBase =
    produto.tamanhos.length > 0
      ? Math.min(...produto.tamanhos.map((t) => t.precoBase))
      : 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Publica a foto/nome no Hero; o botão de voltar fica no header */}
      <SetProdutoHero foto={produto.foto} nome={produto.nome} />

      {/* Ficha do produto: preço em destaque + descrição (nome fica na foto) */}
      <div className="flex flex-col gap-2">
        {produto.montavel ? (
          <span className="text-sm font-medium text-muted-foreground">
            a partir de{" "}
            <span className="font-bold text-primary">
              {formatBRL(precoBase)}
            </span>
          </span>
        ) : (
          <span className="text-3xl font-extrabold text-primary">
            {formatBRL(produto.preco ?? 0)}
          </span>
        )}

        {produto.descricao ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {produto.descricao}
          </p>
        ) : null}
      </div>

      <MontagemForm produto={produto} linhaIdEdicao={editar ?? null} />
    </div>
  );
}
