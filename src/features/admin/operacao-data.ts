import "server-only";
import { prisma } from "@/lib/prisma";
import { parseHorarios } from "@/features/pedido/horario";
import type {
  ClienteAdmin,
  ConfigLojaAdmin,
  DashboardHoje,
  FaturamentoMes,
  MesOpcao,
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
    horarios: parseHorarios(c.horarios),
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

/** Status que NÃO contam como faturamento (não pago / cancelado). */
const STATUS_NAO_FATURADO = ["AGUARDANDO_PAGAMENTO", "CANCELADO"] as const;

const MESES_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/** Início do dia de hoje (horário local do servidor). */
function inicioDeHoje(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Limites [início, fimExclusivo) de um mês "YYYY-MM". */
function limitesDoMes(mes: string): { inicio: Date; fim: Date } {
  const [ano, m] = mes.split("-").map(Number);
  const inicio = new Date(ano, m - 1, 1, 0, 0, 0, 0);
  const fim = new Date(ano, m, 1, 0, 0, 0, 0); // 1º dia do mês seguinte
  return { inicio, fim };
}

/** Dashboard do dia: pedidos recebidos, entregues e cancelados hoje. */
export async function getDashboardHoje(): Promise<DashboardHoje> {
  const desde = inicioDeHoje();
  const [recebidos, entregues, cancelados] = await Promise.all([
    prisma.pedido.count({ where: { createdAt: { gte: desde } } }),
    prisma.pedido.count({
      where: { createdAt: { gte: desde }, status: "ENTREGUE" },
    }),
    prisma.pedido.count({
      where: { createdAt: { gte: desde }, status: "CANCELADO" },
    }),
  ]);
  return { recebidos, entregues, cancelados };
}

/** Faturamento de um mês "YYYY-MM" (apenas pedidos confirmados). */
export async function getHistoricoMensal(mes: string): Promise<FaturamentoMes> {
  const { inicio, fim } = limitesDoMes(mes);
  const agg = await prisma.pedido.aggregate({
    _sum: { total: true },
    _count: true,
    where: {
      createdAt: { gte: inicio, lt: fim },
      status: { notIn: [...STATUS_NAO_FATURADO] },
    },
  });
  return {
    mes,
    total: agg._sum.total === null ? 0 : Number(agg._sum.total),
    quantidade: agg._count,
  };
}

/** Últimos 3 meses (incluindo o atual) para o filtro do histórico. */
export function mesesDisponiveis(): MesOpcao[] {
  const hoje = new Date();
  const opcoes: MesOpcao[] = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const ano = d.getFullYear();
    const m = d.getMonth(); // 0-based
    const valor = `${ano}-${String(m + 1).padStart(2, "0")}`;
    opcoes.push({ valor, label: `${MESES_PT[m]}/${ano}` });
  }
  return opcoes;
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
