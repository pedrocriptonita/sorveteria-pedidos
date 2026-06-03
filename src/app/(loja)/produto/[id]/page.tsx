import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduto } from "@/features/catalogo/data";
import { MontagemForm } from "@/features/catalogo/components/montagem-form";

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
      <Link
        href="/"
        className="text-sm text-neutral-500 underline underline-offset-2"
      >
        ← Voltar ao cardápio
      </Link>

      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">{produto.nome}</h1>
        {produto.descricao ? (
          <p className="text-neutral-600 dark:text-neutral-400">
            {produto.descricao}
          </p>
        ) : null}
      </header>

      <MontagemForm produto={produto} />
    </div>
  );
}
