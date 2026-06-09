"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/features/catalogo/cart/cart-provider";
import { criarPedido } from "../actions";
import type {
  ConfigLojaView,
  FormaPagamento,
  TipoEntrega,
} from "../types";
import { formatBRL } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { lerClienteSalvo, salvarCliente } from "../storage";

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40";

export function CheckoutForm({ config }: { config: ConfigLojaView | null }) {
  const router = useRouter();
  const { itens, subtotal, limpar, pronto } = useCart();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const [nome, setNome] = useState(() => lerClienteSalvo()?.nome ?? "");
  const [telefone, setTelefone] = useState(
    () => lerClienteSalvo()?.telefone ?? "",
  );
  const [tipoEntrega, setTipoEntrega] = useState<TipoEntrega>("RETIRADA");
  const [endereco, setEndereco] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [referencia, setReferencia] = useState("");
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>("PIX");
  const [trocoPara, setTrocoPara] = useState("");
  const [observacao, setObservacao] = useState("");

  const taxa = useMemo(() => {
    if (tipoEntrega === "RETIRADA") return 0;
    if (config?.tipoTaxa === "FIXA") return config.taxaFixa ?? 0;
    // POR_BAIRRO: taxa do bairro escolhido na lista cadastrada pelo admin.
    const zona = config?.bairros.find((b) => b.nome === bairro);
    return zona ? zona.taxa : null;
  }, [tipoEntrega, config, bairro]);

  const total = taxa === null ? null : subtotal + taxa;

  // Loja indisponível: pausa manual ou fora do horário de funcionamento.
  const lojaIndisponivel = config ? config.pausado || !config.aberta : false;
  const msgIndisponivel = config?.pausado
    ? "A loja está pausada no momento e não está recebendo pedidos."
    : "A loja está fechada no momento. Volte no horário de funcionamento.";

  function enviar() {
    setErro(null);
    if (itens.length === 0) {
      setErro("Seu carrinho está vazio.");
      return;
    }

    startTransition(async () => {
      const res = await criarPedido({
        cliente: { nome, telefone },
        tipoEntrega,
        endereco:
          tipoEntrega === "DELIVERY"
            ? { endereco, complemento, referencia, bairro }
            : undefined,
        formaPagamento,
        trocoPara:
          formaPagamento === "DINHEIRO" && trocoPara
            ? Number(trocoPara.replace(",", "."))
            : undefined,
        observacao,
        linhas: itens.map((i) => ({
          produtoId: i.produtoId,
          config: i.config,
          quantidade: i.quantidade,
          observacao: i.observacao,
        })),
      });

      if (!res.ok) {
        setErro(res.erro);
        return;
      }

      salvarCliente({ nome, telefone });
      limpar();
      router.push(`/pedido/${res.pedidoId}`);
    });
  }

  if (!pronto) {
    return <p className="py-16 text-center text-muted-foreground">Carregando…</p>;
  }
  if (itens.length === 0) {
    return (
      <p className="py-16 text-center text-muted-foreground">
        Carrinho vazio. Volte ao cardápio para adicionar itens.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {lojaIndisponivel ? (
        <p className="rounded-md border border-destructive/30 bg-accent px-3 py-2 text-sm text-accent-foreground">
          {msgIndisponivel}
        </p>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">Seus dados</h2>
        <input
          className={inputClass}
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Telefone (WhatsApp)"
          inputMode="tel"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">Entrega</h2>
        <div className="flex gap-2">
          {(["RETIRADA", "DELIVERY"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipoEntrega(t)}
              className={`flex-1 rounded-md border px-3 py-2 text-sm transition-colors ${
                tipoEntrega === t
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-muted"
              }`}
            >
              {t === "RETIRADA" ? "Retirar na loja" : "Entrega"}
            </button>
          ))}
        </div>

        {tipoEntrega === "DELIVERY" ? (
          <div className="flex flex-col gap-2">
            <input
              className={inputClass}
              placeholder="Endereço (rua e número)"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
            />
            {config?.tipoTaxa === "POR_BAIRRO" ? (
              config.bairros.length > 0 ? (
                <select
                  className={inputClass}
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                >
                  <option value="">Selecione o bairro de entrega</option>
                  {config.bairros.map((b) => (
                    <option key={b.nome} value={b.nome}>
                      {b.nome} — {formatBRL(b.taxa)}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground">
                  Nenhum bairro disponível para entrega no momento. Escolha
                  retirar na loja.
                </p>
              )
            ) : (
              <input
                className={inputClass}
                placeholder="Bairro"
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
              />
            )}
            <input
              className={inputClass}
              placeholder="Complemento (opcional)"
              value={complemento}
              onChange={(e) => setComplemento(e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Ponto de referência (opcional)"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
            />
          </div>
        ) : null}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">Pagamento</h2>
        <div className="flex gap-2">
          {(["PIX", "DINHEIRO"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormaPagamento(f)}
              className={`flex-1 rounded-md border px-3 py-2 text-sm transition-colors ${
                formaPagamento === f
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-muted"
              }`}
            >
              {f === "PIX" ? "PIX" : "Dinheiro"}
            </button>
          ))}
        </div>

        {formaPagamento === "PIX" ? (
          <p className="text-sm text-muted-foreground">
            Você vai pagar pelo QR Code / copia-e-cola na próxima tela. A
            confirmação é automática.
          </p>
        ) : (
          <input
            className={inputClass}
            placeholder="Troco para quanto? (opcional)"
            inputMode="decimal"
            value={trocoPara}
            onChange={(e) => setTrocoPara(e.target.value)}
          />
        )}
      </section>

      <section className="flex flex-col gap-2">
        <textarea
          className={inputClass}
          placeholder="Observação do pedido (opcional)"
          rows={2}
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
        />
      </section>

      <section className="flex flex-col gap-1 border-t border-border pt-4 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatBRL(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Taxa de entrega</span>
          <span>
            {tipoEntrega === "RETIRADA"
              ? formatBRL(0)
              : taxa === null
                ? "selecione o bairro"
                : formatBRL(taxa)}
          </span>
        </div>
        <div className="flex justify-between text-base font-bold">
          <span>Total</span>
          <span>{total === null ? formatBRL(subtotal) : formatBRL(total)}</span>
        </div>
      </section>

      {erro ? <p className="text-sm text-destructive">{erro}</p> : null}

      <Button
        type="button"
        size="lg"
        className="w-full"
        onClick={enviar}
        disabled={pending || lojaIndisponivel}
      >
        {pending
          ? "Enviando…"
          : lojaIndisponivel
            ? "Indisponível no momento"
            : "Confirmar pedido"}
      </Button>
    </div>
  );
}
