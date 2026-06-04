"use client";

import Link from "next/link";
import { useCart } from "./cart-provider";
import { formatBRL } from "@/lib/format";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * UI do carrinho. Recebe o pedido mínimo da loja (server) e BLOQUEIA o avanço
 * para o checkout enquanto o subtotal estiver abaixo dele — evita o cliente
 * preencher todo o checkout só para descobrir o mínimo no fim.
 */
export function CarrinhoView({ pedidoMinimo }: { pedidoMinimo: number | null }) {
  const { itens, subtotal, alterarQuantidade, remover, limpar, pronto } =
    useCart();

  if (!pronto) {
    return <p className="py-16 text-center text-muted-foreground">Carregando…</p>;
  }

  if (itens.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <p className="text-lg font-medium">Seu carrinho está vazio 🛒</p>
        <Link
          href="/"
          className="mt-2 inline-block text-sm text-primary underline underline-offset-2"
        >
          Ver o cardápio
        </Link>
      </div>
    );
  }

  const abaixoDoMinimo = pedidoMinimo !== null && subtotal < pedidoMinimo;
  const faltam = pedidoMinimo !== null ? pedidoMinimo - subtotal : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Carrinho</h1>
        <button
          type="button"
          onClick={limpar}
          className="text-sm text-muted-foreground underline underline-offset-2"
        >
          Limpar
        </button>
      </div>

      <ul className="flex flex-col gap-3">
        {itens.map((item) => (
          <Card key={item.linhaId} className="flex flex-col gap-2 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium">{item.nomeProduto}</p>
                {item.tamanhoNome ? (
                  <p className="text-sm text-muted-foreground">
                    {item.tamanhoNome}
                  </p>
                ) : null}
                {item.opcoesResumo.map((op) => (
                  <p key={op.grupoNome} className="text-xs text-muted-foreground">
                    <span className="font-medium">{op.grupoNome}:</span>{" "}
                    {op.itens.join(", ")}
                  </p>
                ))}
              </div>
              <button
                type="button"
                onClick={() => remover(item.linhaId)}
                className="shrink-0 text-sm text-destructive underline underline-offset-2"
              >
                Remover
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => alterarQuantidade(item.linhaId, item.quantidade - 1)}
                  aria-label="Diminuir"
                >
                  −
                </Button>
                <span className="w-6 text-center text-sm">{item.quantidade}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => alterarQuantidade(item.linhaId, item.quantidade + 1)}
                  aria-label="Aumentar"
                >
                  +
                </Button>
              </div>
              <span className="text-sm font-semibold">
                {formatBRL(item.precoUnitario * item.quantidade)}
              </span>
            </div>
          </Card>
        ))}
      </ul>

      <div className="sticky bottom-0 flex flex-col gap-3 border-t border-border bg-background pt-4">
        <div className="flex items-center justify-between text-lg font-bold">
          <span>Subtotal</span>
          <span>{formatBRL(subtotal)}</span>
        </div>

        <Link
          href="/"
          className={buttonVariants({ variant: "outline", size: "lg", className: "w-full" })}
        >
          + Continuar comprando
        </Link>

        {abaixoDoMinimo ? (
          <>
            <p className="rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground">
              Pedido mínimo de {formatBRL(pedidoMinimo!)}. Faltam{" "}
              {formatBRL(faltam)} para finalizar.
            </p>
            <Button type="button" size="lg" className="w-full" disabled>
              Finalizar pedido
            </Button>
          </>
        ) : (
          <Link
            href="/checkout"
            className={buttonVariants({ size: "lg", className: "w-full" })}
          >
            Finalizar pedido
          </Link>
        )}
      </div>
    </div>
  );
}
