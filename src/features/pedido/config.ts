import "server-only";
import { prisma } from "@/lib/prisma";
import { estaAberta, parseHorarios } from "./horario";
import type { ConfigLojaView, TipoEntrega } from "./types";

/** Config da loja (linha única). null se ainda não foi criada (rode o seed). */
export async function getConfigLoja() {
  return prisma.configLoja.findFirst();
}

/** Versão serializável para o client (sem Decimal). */
export async function getConfigLojaView(): Promise<ConfigLojaView | null> {
  const cfg = await getConfigLoja();
  if (!cfg) return null;
  return {
    pausado: cfg.pausado,
    aberta: estaAberta(parseHorarios(cfg.horarios)),
    tipoTaxa: cfg.tipoTaxa,
    taxaFixa: cfg.taxaFixa === null ? null : Number(cfg.taxaFixa),
    pedidoMinimo: cfg.pedidoMinimo === null ? null : Number(cfg.pedidoMinimo),
  };
}

export interface ResultadoTaxa {
  /** false quando a loja não entrega no bairro informado. */
  entregavel: boolean;
  taxa: number;
}

/**
 * Calcula a taxa de entrega conforme a configuração da loja.
 * RETIRADA = 0. DELIVERY = taxa fixa OU taxa do bairro (POR_BAIRRO).
 */
export async function calcularTaxaEntrega(
  tipoEntrega: TipoEntrega,
  bairro?: string,
): Promise<ResultadoTaxa> {
  if (tipoEntrega === "RETIRADA") return { entregavel: true, taxa: 0 };

  const cfg = await getConfigLoja();
  if (!cfg) return { entregavel: true, taxa: 0 };

  if (cfg.tipoTaxa === "FIXA") {
    return { entregavel: true, taxa: Number(cfg.taxaFixa ?? 0) };
  }

  // POR_BAIRRO
  if (!bairro) return { entregavel: false, taxa: 0 };
  const zona = await prisma.zonaEntrega.findFirst({
    where: { bairro, ativo: true, deletedAt: null },
  });
  if (!zona) return { entregavel: false, taxa: 0 };
  return { entregavel: true, taxa: Number(zona.taxa) };
}
