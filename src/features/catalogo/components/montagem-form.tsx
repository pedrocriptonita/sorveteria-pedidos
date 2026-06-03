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

export function MontagemForm({ produto }: { produto: ProdutoView }) {
  const router = useRouter();
  const { adicionar } = useCart();

  const [config, setConfig] = useState<SelecaoConfig>({
    tamanhoId: produto.tamanhos[0]?.id ?? null,
    selecoes: {},
  });
  const [quantidade, setQuantidade] = useState(1);

  const resultado = useMemo(
    () => calcularPreco(produto, config),
    [produto, config],
  );
  const valido = resultado.erros.length === 0;

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
    adicionar({
      produtoId: produto.id,
      nomeProduto: produto.nome,
      montavel: produto.montavel,
      tamanhoNome: nomeTamanho(produto, config),
      opcoesResumo: resumirOpcoes(produto, config),
      quantidade,
      precoUnitario: resultado.precoUnitario,
      config,
    });
    router.push("/carrinho");
  }

  return (
    <div className="flex flex-col gap-6">
      {produto.tamanhos.length > 0 ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 font-medium">Tamanho</legend>
          {produto.tamanhos.map((t) => (
            <label
              key={t.id}
              className="flex cursor-pointer items-center justify-between rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-800"
            >
              <span className="flex items-center gap-2 text-sm">
                <input
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
                <span className="ml-1 text-red-600">*</span>
              ) : null}
            </legend>
            <p className="text-xs text-neutral-500">
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
                  className={`flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-800 ${
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
                      <span className="text-xs text-neutral-400">(esgotado)</span>
                    ) : null}
                  </span>
                  {item.precoExtra > 0 ? (
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      + {formatBRL(item.precoExtra)}
                    </span>
                  ) : null}
                </label>
              );
            })}
          </fieldset>
        );
      })}

      {/* Quantidade + adicionar */}
      <div className="sticky bottom-0 flex flex-col gap-3 border-t border-neutral-200 bg-background pt-4 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Quantidade</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
              className="h-8 w-8 rounded-md border border-neutral-300 dark:border-neutral-700"
              aria-label="Diminuir"
            >
              −
            </button>
            <span className="w-6 text-center">{quantidade}</span>
            <button
              type="button"
              onClick={() => setQuantidade((q) => q + 1)}
              className="h-8 w-8 rounded-md border border-neutral-300 dark:border-neutral-700"
              aria-label="Aumentar"
            >
              +
            </button>
          </div>
        </div>

        {!valido ? (
          <p className="text-sm text-red-600">{resultado.erros[0]}</p>
        ) : null}

        <button
          type="button"
          onClick={adicionarAoCarrinho}
          disabled={!valido}
          className="rounded-md bg-neutral-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          Adicionar {formatBRL(resultado.precoUnitario * quantidade)}
        </button>
      </div>
    </div>
  );
}
