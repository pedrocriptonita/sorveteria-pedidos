"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../cart/cart-provider";
import {
  calcularPreco,
  nomeTamanho,
  resumirOpcoes,
} from "../pricing";
import type { GrupoOpcaoView, ProdutoView, SelecaoConfig } from "../types";
import { formatBRL } from "@/lib/format";
import { Button } from "@/components/ui/button";

export function MontagemForm({
  produto,
  linhaIdEdicao = null,
}: {
  produto: ProdutoView;
  /** Quando setado, edita a linha do carrinho com este id (em vez de adicionar). */
  linhaIdEdicao?: string | null;
}) {
  const router = useRouter();
  const { adicionar, substituir, itens, pronto } = useCart();

  // Linha sendo editada (se houver). Lê a config/quantidade salvas no carrinho.
  const linhaEdicao = linhaIdEdicao
    ? itens.find((i) => i.linhaId === linhaIdEdicao)
    : undefined;
  const editando = linhaEdicao !== undefined;

  const [config, setConfig] = useState<SelecaoConfig>(
    () =>
      linhaEdicao?.config ?? {
        tamanhoId: produto.tamanhos[0]?.id ?? null,
        selecoes: {},
      },
  );
  const [quantidade, setQuantidade] = useState(() => linhaEdicao?.quantidade ?? 1);

  const resultado = useMemo(
    () => calcularPreco(produto, config),
    [produto, config],
  );
  const valido = resultado.erros.length === 0;

  // Editar depende do carrinho (localStorage), que só existe após hidratar.
  // Gate evita divergência SSR/cliente no modo edição.
  if (linhaIdEdicao && !pronto) {
    return (
      <p className="py-16 text-center text-muted-foreground">Carregando…</p>
    );
  }

  function setTamanho(id: string) {
    setConfig((c) => ({ ...c, tamanhoId: id }));
  }

  function toggleItem(grupo: GrupoOpcaoView, itemId: string) {
    setConfig((c) => {
      const atual = c.selecoes[grupo.id] ?? [];

      if (grupo.tipo === "UNICO") {
        const proximo = atual.includes(itemId) ? [] : [itemId];
        return { ...c, selecoes: { ...c.selecoes, [grupo.id]: proximo } };
      }

      // MULTIPLO
      let proximo: string[];
      if (atual.includes(itemId)) {
        proximo = atual.filter((id) => id !== itemId);
      } else {
        if (grupo.max !== null && atual.length >= grupo.max) return c; // trava no máximo
        proximo = [...atual, itemId];
      }
      return { ...c, selecoes: { ...c.selecoes, [grupo.id]: proximo } };
    });
  }

  function adicionarAoCarrinho() {
    if (!valido) return;
    const item = {
      produtoId: produto.id,
      nomeProduto: produto.nome,
      montavel: produto.montavel,
      tamanhoNome: nomeTamanho(produto, config),
      opcoesResumo: resumirOpcoes(produto, config),
      quantidade,
      precoUnitario: resultado.precoUnitario,
      config,
    };
    if (editando) {
      substituir(linhaIdEdicao!, item);
    } else {
      adicionar(item);
    }
    router.push("/carrinho");
  }

  return (
    <div className="flex flex-col gap-6 pb-40">
      {produto.tamanhos.length > 0 ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 font-medium">Tamanho</legend>
          {produto.tamanhos.map((t) => (
            <label
              key={t.id}
              className="flex cursor-pointer items-center justify-between rounded-md border border-border px-3 py-2"
            >
              <span className="flex items-center gap-2 text-sm">
                <input
                  className="accent-primary"
                  type="radio"
                  name="tamanho"
                  checked={config.tamanhoId === t.id}
                  onChange={() => setTamanho(t.id)}
                />
                {t.nome}
              </span>
              <span className="text-sm font-medium">{formatBRL(t.precoBase)}</span>
            </label>
          ))}
        </fieldset>
      ) : null}

      {produto.grupos.map((grupo) => {
        const selecionados = config.selecoes[grupo.id] ?? [];
        const noMaximo =
          grupo.max !== null && selecionados.length >= grupo.max;

        return (
          <fieldset key={grupo.id} className="flex flex-col gap-2">
            <legend className="mb-1 font-medium">
              {grupo.nome}
              {grupo.obrigatorio ? (
                <span className="ml-1 text-destructive">*</span>
              ) : null}
            </legend>
            <p className="text-xs text-muted-foreground">
              {grupo.tipo === "UNICO" ? "Escolha 1" : "Escolha vários"}
              {grupo.cotaGratis > 0
                ? ` · ${grupo.cotaGratis} grátis`
                : ""}
              {grupo.max !== null ? ` · até ${grupo.max}` : ""}
            </p>

            {grupo.itens.map((item) => {
              const marcado = selecionados.includes(item.id);
              const desabilitado =
                !item.disponivel ||
                (grupo.tipo === "MULTIPLO" && noMaximo && !marcado);
              return (
                <label
                  key={item.id}
                  className={`flex items-center justify-between rounded-md border border-border px-3 py-2 ${
                    desabilitado
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer"
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm">
                    <input
                      type={grupo.tipo === "UNICO" ? "radio" : "checkbox"}
                      name={`grupo-${grupo.id}`}
                      checked={marcado}
                      disabled={desabilitado}
                      onChange={() => toggleItem(grupo, item.id)}
                    />
                    {item.nome}
                    {!item.disponivel ? (
                      <span className="text-xs text-muted-foreground">
                        (esgotado)
                      </span>
                    ) : null}
                  </span>
                  {item.precoExtra > 0 ? (
                    <span className="text-sm text-muted-foreground">
                      + {formatBRL(item.precoExtra)}
                    </span>
                  ) : null}
                </label>
              );
            })}
          </fieldset>
        );
      })}

      {/* Barra de ação FIXA, logo acima do menu inferior (BottomNav h-20). */}
      <div className="fixed inset-x-0 bottom-20 z-40 border-t border-border bg-background shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        <div className="mx-auto flex max-w-md flex-col gap-3 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Quantidade</span>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
                aria-label="Diminuir"
              >
                −
              </Button>
              <span className="w-6 text-center">{quantidade}</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setQuantidade((q) => q + 1)}
                aria-label="Aumentar"
              >
                +
              </Button>
            </div>
          </div>

          {!valido ? (
            <p className="text-sm text-destructive">{resultado.erros[0]}</p>
          ) : null}

          <Button
            type="button"
            size="lg"
            className="w-full"
            onClick={adicionarAoCarrinho}
            disabled={!valido}
          >
            {editando ? "Salvar alterações" : "Adicionar ao carrinho"} ·{" "}
            {formatBRL(resultado.precoUnitario * quantidade)}
          </Button>
        </div>
      </div>
    </div>
  );
}
