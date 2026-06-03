import "server-only";
import { prisma } from "@/lib/prisma";
import type { OpcaoResumo } from "@/features/catalogo/types";
import type { JobImpressaoView, PedidoCozinha } from "./types";

/** Status que aparecem no painel da cozinha (pipeline ativo). */
const STATUS_ATIVOS = [
  "NA_FILA",
  "IMPRESSO",
  "EM_PREPARO",
  "PRONTO",
  "SAIU_PARA_ENTREGA",
] as const;

/** Pedidos ativos para o KDS, em ordem FIFO (mais antigos primeiro). */
export async function getPedidosCozinha(): Promise<PedidoCozinha[]> {
  const pedidos = await prisma.pedido.findMany({
    where: { status: { in: [...STATUS_ATIVOS] } },
    orderBy: { createdAt: "asc" },
    include: { itens: { orderBy: { createdAt: "asc" } } },
  });

  const agora = Date.now();
  return pedidos.map((p) => ({
    id: p.id,
    numero: p.numero,
    status: p.status,
    tipoEntrega: p.tipoEntrega,
    formaPagamento: p.formaPagamento === "CARTAO" ? "PIX" : p.formaPagamento,
    total: Number(p.total),
    observacao: p.observacao,
    enderecoSnapshot: p.enderecoSnapshot,
    bairroSnapshot: p.bairroSnapshot,
    criadoEm: p.createdAt.toISOString(),
    esperaMin: Math.floor((agora - p.createdAt.getTime()) / 60000),
    itens: p.itens.map((i) => ({
      nome: i.nomeProdutoSnapshot,
      quantidade: i.quantidade,
      tamanho: i.tamanho,
      opcoes: (i.opcoes as OpcaoResumo[] | null) ?? [],
      observacao: i.observacao,
    })),
  }));
}

/** Jobs de impressão que precisam de atenção: PENDENTE (preso) ou ERRO. */
export async function getMonitorImpressao(): Promise<JobImpressaoView[]> {
  const jobs = await prisma.filaImpressao.findMany({
    where: { status: { in: ["PENDENTE", "ERRO"] } },
    orderBy: { createdAt: "asc" },
    include: { pedido: { select: { numero: true } } },
  });

  return jobs.map((j) => ({
    id: j.id,
    pedidoId: j.pedidoId,
    pedidoNumero: j.pedido.numero,
    status: j.status,
    tentativas: j.tentativas,
    ultimoErro: j.ultimoErro,
    criadoEm: j.createdAt.toISOString(),
  }));
}
