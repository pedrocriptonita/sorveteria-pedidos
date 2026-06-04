import Link from "next/link";
import { getConfigLojaView } from "@/features/pedido/config";
import { CheckoutForm } from "@/features/pedido/components/checkout-form";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const config = await getConfigLojaView();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/carrinho"
        className="text-sm text-muted-foreground underline underline-offset-2"
      >
        ← Voltar ao carrinho
      </Link>
      <h1 className="text-2xl font-bold">Finalizar pedido</h1>
      {config?.pausado ? (
        <p className="rounded-md border border-destructive/30 bg-accent px-3 py-2 text-sm text-accent-foreground">
          A loja está pausada no momento e não está recebendo pedidos.
        </p>
      ) : null}
      <CheckoutForm config={config} />
    </div>
  );
}
