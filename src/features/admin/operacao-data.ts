import "server-only";
import { prisma } from "@/lib/prisma";
import type {
  ClienteAdmin,
  ConfigLojaAdmin,
  PedidoAdminResumo,
  ZonaAdmin,
} from "./types";

const STATUS_TERMINAIS = ["ENTREGUE", "CANCELADO"];

/** Garante que exista a linha única de ConfigLoja e a retorna. */
export async function garantirConfig() {
  const existente = await prisma.configLoja.findFirst();
  if (existente) return existente;
  return prisma.configLoja.create({ data: {} });
}

export async function getConfigLojaAdmin(): Promise<ConfigLojaAdmin> {
  const c = await garantirConfig();
  return {
    id: c.id,
    nomeLoja: c.nomeLoja,
    pausado: c.pausado,
    tipoTaxa: c.tipoTaxa,
    taxaFixa: c.taxaFixa === null ? null : Number(c.taxaFixa),
    pedidoMinimo: c.pedidoMinimo === null ? null : Number(c.pedidoMinimo),
  };
}

export async function getZonas(): Promise<ZonaAdmin[]> {
  const zonas = await prisma.zonaEntrega.findMany({
    where: { deletedAt: null },
    orderBy: { bairro: "asc" },
  });
  return zonas.map((z) => ({
    id: z.id,
    bairro: z.bairro,
    taxa: Number(z.taxa),
    tempoEstimado: z.tempoEstimado,
    ativo: z.ativo,
  }));
}

/** Pedidos recentes para o admin (limite para não pesar). */
export async function getPedidosAdmin(limit = 50): Promise<PedidoAdminResumo[]> {
  const pedidos = await prisma.pedido.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { cliente: { select: { nome: true, telefone: true } } },
  });

  return pedidos.map((p) => ({
    id: p.id,
    numero: p.numero,
    status: p.status,
    tipoEntrega: p.tipoEntrega,
    formaPagamento: p.formaPagamento === "CARTAO" ? "PIX" : p.formaPagamento,
    total: Number(p.total),
    criadoEm: p.createdAt.toISOString(),
    clienteNome: p.cliente.nome,
    clienteTelefone: p.cliente.telefone,
    podeCancelar: !STATUS_TERMINAIS.includes(p.status),
  }));
}

export async function getClientes(): Promise<ClienteAdmin[]> {
  const clientes = await prisma.cliente.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { pedidos: true } } },
  });
  return clientes.map((c) => ({
    id: c.id,
    nome: c.nome,
    telefone: c.telefone,
    bloqueado: c.bloqueado,
    qtdPedidos: c._count.pedidos,
  }));
}
