"use server";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPsp } from "@/lib/psp";
import { enfileirarImpressao } from "@/lib/print/queue";
import { getConfigLoja, calcularTaxaEntrega } from "./config";
import { estaAberta, parseHorarios } from "./horario";
import { recomputarItens } from "./pricing-server";
import { comandaDeItens } from "./comanda";
import { checkoutSchema } from "./schema";
import type { CheckoutInput, ItemRecalculado, ResultadoCriarPedido } from "./types";

/** Dados de ItemPedido a partir do item recalculado (com snapshots). */
function itemPedidoData(i: ItemRecalculado): Prisma.ItemPedidoCreateWithoutPedidoInput {
  return {
    quantidade: i.quantidade,
    precoUnitario: i.precoUnitario,
    precoTotal: i.precoTotal,
    tamanho: i.tamanhoNome,
    opcoes: i.opcoesResumo as unknown as Prisma.InputJsonValue,
    observacao: i.observacao,
    nomeProdutoSnapshot: i.nomeProduto,
    produto: { connect: { id: i.produtoId } },
  };
}

/**
 * Cria um pedido a partir do carrinho. Recalcula preços no servidor, valida a
 * loja, cria cliente/endereço/pedido/pagamento. Dinheiro entra direto NA_FILA e
 * imprime; PIX gera cobrança no PSP e aguarda confirmação (webhook/polling).
 */
export async function criarPedido(
  input: CheckoutInput,
): Promise<ResultadoCriarPedido> {
  // Validação de forma/limites do payload (client não é confiável). Os preços
  // continuam recalculados no servidor; aqui barramos entradas malformadas.
  const validacao = checkoutSchema.safeParse(input);
  if (!validacao.success) {
    // Observabilidade: registra os campos rejeitados (sem dados sensíveis).
    console.warn(
      "[criarPedido] payload inválido:",
      validacao.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    );
    return { ok: false, erro: "Dados do pedido inválidos. Revise e tente novamente." };
  }

  const cfg = await getConfigLoja();
  if (cfg?.pausado) {
    return { ok: false, erro: "A loja está pausada no momento." };
  }
  if (!estaAberta(parseHorarios(cfg?.horarios))) {
    return { ok: false, erro: "A loja está fechada no momento. Volte no horário de funcionamento." };
  }

  // 1) Recalcula itens (anti-fraude).
  const { itens, subtotal, erros } = await recomputarItens(input.linhas);
  if (erros.length > 0) return { ok: false, erro: erros[0] };
  if (itens.length === 0) return { ok: false, erro: "Carrinho vazio." };

  // 2) Pedido mínimo.
  if (cfg?.pedidoMinimo && subtotal < Number(cfg.pedidoMinimo)) {
    return {
      ok: false,
      erro: `Pedido mínimo de ${Number(cfg.pedidoMinimo).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}.`,
    };
  }

  // 3) Taxa de entrega.
  const bairro = input.endereco?.bairro;
  const { entregavel, taxa } = await calcularTaxaEntrega(
    input.tipoEntrega,
    bairro,
  );
  if (!entregavel) {
    return { ok: false, erro: "Não entregamos no bairro informado." };
  }
  if (input.tipoEntrega === "DELIVERY" && !input.endereco?.endereco?.trim()) {
    return { ok: false, erro: "Informe o endereço de entrega." };
  }

  const total = subtotal + taxa;

  // 4) Cliente (find-or-create por telefone).
  const telefone = input.cliente.telefone.replace(/\D/g, "");
  const cliente = await prisma.cliente.upsert({
    where: { telefone },
    update: { nome: input.cliente.nome.trim() },
    create: { nome: input.cliente.nome.trim(), telefone },
  });

  // Anti-abuso: 1 pedido aguardando pagamento por cliente a cada 60s.
  // `criarPedido` é uma action pública que gera cobrança no PSP; sem isso um
  // bot poderia criar centenas de cobranças (custo/risco) e poluir o KDS.
  const pendenteRecente = await prisma.pedido.findFirst({
    where: {
      clienteId: cliente.id,
      status: "AGUARDANDO_PAGAMENTO",
      createdAt: { gte: new Date(Date.now() - 60_000) },
    },
    select: { id: true },
  });
  if (pendenteRecente) {
    return {
      ok: false,
      erro: "Você já tem um pedido aguardando pagamento. Conclua-o antes de criar outro.",
    };
  }

  // Anti-trote: cliente bloqueado não paga em dinheiro.
  if (input.formaPagamento === "DINHEIRO" && cliente.bloqueado) {
    return {
      ok: false,
      erro: "Pagamento em dinheiro indisponível para este cadastro.",
    };
  }

  // 5) Endereço (delivery) + snapshot.
  let enderecoId: string | null = null;
  if (input.tipoEntrega === "DELIVERY" && input.endereco) {
    const end = await prisma.endereco.create({
      data: {
        clienteId: cliente.id,
        endereco: input.endereco.endereco,
        complemento: input.endereco.complemento,
        referencia: input.endereco.referencia,
        bairro: input.endereco.bairro,
      },
    });
    enderecoId = end.id;
  }

  const dinheiro = input.formaPagamento === "DINHEIRO";

  // 6) Cria o pedido + itens (status conforme a forma).
  const pedido = await prisma.pedido.create({
    data: {
      status: dinheiro ? "NA_FILA" : "AGUARDANDO_PAGAMENTO",
      tipoEntrega: input.tipoEntrega,
      formaPagamento: input.formaPagamento,
      subtotal,
      taxaEntrega: taxa,
      total,
      trocoPara: dinheiro && input.trocoPara ? input.trocoPara : null,
      observacao: input.observacao?.trim() || null,
      clienteId: cliente.id,
      enderecoId,
      enderecoSnapshot: input.endereco?.endereco ?? null,
      complementoSnapshot: input.endereco?.complemento ?? null,
      referenciaSnapshot: input.endereco?.referencia ?? null,
      bairroSnapshot: input.endereco?.bairro ?? null,
      itens: { create: itens.map(itemPedidoData) },
    },
  });

  // 7) Pagamento + efeitos colaterais.
  if (dinheiro) {
    await prisma.pagamento.create({
      data: {
        pedidoId: pedido.id,
        forma: "DINHEIRO",
        status: "AGUARDANDO", // confirmado na entrega/retirada
        valor: total,
      },
    });
    await enfileirarImpressao(
      pedido.id,
      comandaDeItens(pedido.numero, input.tipoEntrega, itens, total, pedido.observacao ?? undefined),
    );
    return { ok: true, pedidoId: pedido.id };
  }

  // PIX: cria a cobrança no PSP e grava QR/copia-e-cola.
  try {
    const cobranca = await getPsp().criarCobranca({
      valor: total,
      referenciaExterna: pedido.id,
      descricao: `Pedido #${pedido.numero}`,
      // CPF/CNPJ vem da config da loja (PSP_CPF_CNPJ) no adapter; cliente não digita.
      pagador: { nome: cliente.nome },
    });
    await prisma.pagamento.create({
      data: {
        pedidoId: pedido.id,
        forma: "PIX",
        status: cobranca.status,
        valor: total,
        pspTxid: cobranca.txid,
        pixQrCode: cobranca.qrCode,
        pixCopiaCola: cobranca.copiaCola,
        expiraEm: cobranca.expiraEm,
      },
    });
  } catch (err) {
    // Falhou gerar a cobrança: cancela o pedido para não ficar pendurado.
    await prisma.pedido.update({
      where: { id: pedido.id },
      data: { status: "CANCELADO" },
    });
    console.error("Falha ao criar cobrança PIX:", (err as Error).message);
    return {
      ok: false,
      erro: "Não foi possível gerar a cobrança PIX. Tente novamente.",
    };
  }

  return { ok: true, pedidoId: pedido.id };
}
