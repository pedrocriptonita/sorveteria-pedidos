import type { OpcaoResumo, SelecaoConfig } from "@/features/catalogo/types";

export type TipoEntrega = "RETIRADA" | "DELIVERY";
export type FormaPagamento = "PIX" | "DINHEIRO";

/** Uma linha do carrinho enviada ao servidor (sem preço — recalculado lá). */
export interface CheckoutLinha {
  produtoId: string;
  config: SelecaoConfig;
  quantidade: number;
}

export interface EnderecoInput {
  endereco: string;
  complemento?: string;
  referencia?: string;
  bairro?: string;
}

/** Payload do checkout (vem do client; preços NÃO são confiáveis). */
export interface CheckoutInput {
  cliente: { nome: string; telefone: string };
  tipoEntrega: TipoEntrega;
  endereco?: EnderecoInput;
  formaPagamento: FormaPagamento;
  /** Troco para (pagamento em dinheiro). */
  trocoPara?: number;
  observacao?: string;
  linhas: CheckoutLinha[];
}

export type ResultadoCriarPedido =
  | { ok: true; pedidoId: string }
  | { ok: false; erro: string };

/** Item já recalculado no servidor, pronto para virar ItemPedido / comanda. */
export interface ItemRecalculado {
  produtoId: string;
  nomeProduto: string;
  tamanhoNome: string | null;
  opcoesResumo: OpcaoResumo[];
  quantidade: number;
  precoUnitario: number;
  precoTotal: number;
}

/** Config da loja exposta ao checkout (client). */
export interface ConfigLojaView {
  pausado: boolean;
  tipoTaxa: "FIXA" | "POR_BAIRRO";
  taxaFixa: number | null;
  pedidoMinimo: number | null;
}

// ---------------------------------------------------------------------------
// Visão do pedido (tela de status)
// ---------------------------------------------------------------------------

export type StatusPedidoView =
  | "AGUARDANDO_PAGAMENTO"
  | "PAGO"
  | "NA_FILA"
  | "IMPRESSO"
  | "EM_PREPARO"
  | "PRONTO"
  | "SAIU_PARA_ENTREGA"
  | "ENTREGUE"
  | "CANCELADO";

export interface ItemPedidoView {
  id: string;
  nome: string;
  quantidade: number;
  tamanho: string | null;
  opcoes: OpcaoResumo[];
  precoTotal: number;
  observacao: string | null;
}

export interface PagamentoPixView {
  status: string;
  qrCode: string | null;
  copiaCola: string | null;
  expiraEm: string | null;
}

export interface PedidoView {
  id: string;
  numero: number;
  status: StatusPedidoView;
  tipoEntrega: TipoEntrega;
  formaPagamento: FormaPagamento;
  subtotal: number;
  taxaEntrega: number;
  total: number;
  trocoPara: number | null;
  observacao: string | null;
  enderecoSnapshot: string | null;
  bairroSnapshot: string | null;
  itens: ItemPedidoView[];
  pix: PagamentoPixView | null;
}

// ---------------------------------------------------------------------------
// Histórico do cliente (login leve por nome + telefone)
// ---------------------------------------------------------------------------

/** Resumo de um pedido para a lista de histórico do cliente. */
export interface PedidoHistorico {
  id: string;
  numero: number;
  status: StatusPedidoView;
  total: number;
  criadoEm: string; // ISO
  itens: Array<{
    nome: string;
    quantidade: number;
    tamanho: string | null;
    opcoes: OpcaoResumo[];
  }>;
}
