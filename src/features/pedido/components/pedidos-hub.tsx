"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/features/catalogo/cart/cart-provider";
import { CheckoutForm } from "./checkout-form";
import { buscarHistorico, repetirPedido } from "../historico-actions";
import type { ConfigLojaView, PedidoHistorico } from "../types";
import {
  lerClienteSalvo,
  salvarCliente,
  type ClienteSalvo,
} from "../storage";
import { STATUS_LABEL_CURTO } from "../status";
import { formatBRL } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40";

function dataCurta(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

export function PedidosHub({ config }: { config: ConfigLojaView | null }) {
  const { itens, pronto, adicionar } = useCart();
  const [cliente, setCliente] = useState<ClienteSalvo | null>(() =>
    lerClienteSalvo(),
  );

  // Form de login leve.
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erroLogin, setErroLogin] = useState<string | null>(null);

  if (!pronto) {
    return (
      <p className="py-16 text-center text-muted-foreground">Carregando…</p>
    );
  }

  function entrar() {
    setErroLogin(null);
    if (!nome.trim() || telefone.replace(/\D/g, "").length < 8) {
      setErroLogin("Informe seu nome e um telefone válido.");
      return;
    }
    const c = { nome: nome.trim(), telefone: telefone.trim() };
    salvarCliente(c);
    setCliente(c);
  }

  // ----- Sem login: formulário simples (nome + telefone) -----
  if (!cliente) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold">Seus pedidos</h1>
        <p className="text-sm text-muted-foreground">
          Entre com nome e telefone para finalizar seu pedido e ver seu
          histórico de compras.
        </p>
        <div className="flex flex-col gap-3">
          <input
            className={inputClass}
            placeholder="Seu nome"
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
          {erroLogin ? (
            <p className="text-sm text-destructive">{erroLogin}</p>
          ) : null}
          <Button type="button" size="lg" className="w-full" onClick={entrar}>
            Entrar
          </Button>
        </div>
      </div>
    );
  }

  // ----- Logado -----
  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">Seus pedidos</h1>
          <span className="text-sm text-muted-foreground">
            Olá, {cliente.nome}!
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            setNome(cliente.nome);
            setTelefone(cliente.telefone);
            setCliente(null);
          }}
          className="text-sm text-muted-foreground underline underline-offset-2"
        >
          Trocar
        </button>
      </header>

      {/* Checkout do pedido atual (se houver itens no carrinho) */}
      {itens.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="font-semibold">Finalizar pedido</h2>
          {config?.pausado ? (
            <p className="rounded-md border border-destructive/30 bg-accent px-3 py-2 text-sm text-accent-foreground">
              A loja está pausada no momento e não está recebendo pedidos.
            </p>
          ) : null}
          <CheckoutForm config={config} />
        </section>
      ) : (
        <section className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          Seu carrinho está vazio.{" "}
          <Link
            href="/"
            className="text-primary underline underline-offset-2"
          >
            Ver o cardápio
          </Link>
        </section>
      )}

      {/* Histórico de compras */}
      <Historico telefone={cliente.telefone} onAdicionar={adicionar} />
    </div>
  );
}

function Historico({
  telefone,
  onAdicionar,
}: {
  telefone: string;
  onAdicionar: ReturnType<typeof useCart>["adicionar"];
}) {
  const router = useRouter();
  const [pedidos, setPedidos] = useState<PedidoHistorico[] | null>(null);
  const [carregando, startCarregar] = useTransition();
  const [repetindo, startRepetir] = useTransition();
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    startCarregar(async () => {
      const lista = await buscarHistorico(telefone);
      setPedidos(lista);
    });
  }, [telefone]);

  function repetir(pedidoId: string) {
    setAviso(null);
    startRepetir(async () => {
      const { itens, avisos } = await repetirPedido(pedidoId);
      for (const item of itens) onAdicionar(item);
      if (avisos.length > 0) {
        setAviso(
          `Alguns itens não puderam ser adicionados: ${avisos.join(" ")}`,
        );
      }
      if (itens.length > 0) router.push("/carrinho");
      else setAviso("Nenhum item deste pedido está disponível para repetir.");
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-semibold">Historico de pedidos</h2>

      {aviso ? (
        <p className="rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground">
          {aviso}
        </p>
      ) : null}

      {carregando && pedidos === null ? (
        <p className="text-sm text-muted-foreground">Carregando histórico…</p>
      ) : pedidos && pedidos.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {pedidos.map((p) => (
            <Card key={p.id} className="flex flex-col gap-2 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">#{p.numero}</span>
                <span className="text-xs text-muted-foreground">
                  {dataCurta(p.criadoEm)} ·{" "}
                  {STATUS_LABEL_CURTO[p.status] ?? p.status}
                </span>
              </div>
              <ul className="flex flex-col gap-0.5 text-sm text-muted-foreground">
                {p.itens.map((item, idx) => (
                  <li key={idx}>
                    {item.quantidade}× {item.nome}
                    {item.tamanho ? ` (${item.tamanho})` : ""}
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">
                  {formatBRL(p.total)}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => repetir(p.id)}
                  disabled={repetindo}
                >
                  Repetir
                </Button>
              </div>
            </Card>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          Você ainda não fez pedidos.
        </p>
      )}
    </section>
  );
}
