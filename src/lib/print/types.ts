import type { TipoEntrega } from "@prisma/client";

/**
 * Conteúdo estruturado da comanda, salvo em FilaImpressao.conteudo (Json).
 * O agente local formata isso em ESC/POS na térmica. Mantido simples na
 * Fase 3; ganha campos (cliente, endereço, pagamento) na Fase 5/6.
 */
export interface ComandaItem {
  nome: string;
  quantidade: number;
  observacao?: string;
}

export interface ComandaPayload {
  numeroPedido: number;
  tipoEntrega: TipoEntrega;
  itens: ComandaItem[];
  observacao?: string;
  total: number;
  criadoEm: string; // ISO
}

/** Job entregue ao agente de impressão via API. */
export interface PrintJobDTO {
  id: string;
  pedidoId: string;
  tentativas: number;
  criadoEm: string; // ISO
  conteudo: ComandaPayload | null;
}
