import type { TipoGrupo } from "@/features/catalogo/types";

/** Visões do catálogo para o admin (mostram inativos/indisponíveis; só ocultam soft-deletados). */

export interface ProdutoAdmin {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number | null;
  montavel: boolean;
  disponivel: boolean;
}

export interface CategoriaAdmin {
  id: string;
  nome: string;
  ordem: number;
  ativo: boolean;
  produtos: ProdutoAdmin[];
}

export interface TamanhoAdmin {
  id: string;
  nome: string;
  precoBase: number;
}

export interface ItemAdmin {
  id: string;
  nome: string;
  precoExtra: number;
  disponivel: boolean;
}

export interface GrupoAdmin {
  id: string;
  nome: string;
  tipo: TipoGrupo;
  min: number;
  max: number | null;
  cotaGratis: number;
  obrigatorio: boolean;
  itens: ItemAdmin[];
}

export interface ProdutoAdminFull extends ProdutoAdmin {
  categoriaId: string;
  foto: string | null;
  tamanhos: TamanhoAdmin[];
  grupos: GrupoAdmin[];
}

// ---------------------------------------------------------------------------
// Configuração & operação (Fase 7 parte 2)
// ---------------------------------------------------------------------------

export interface ConfigLojaAdmin {
  id: string;
  nomeLoja: string | null;
  pausado: boolean;
  tipoTaxa: "FIXA" | "POR_BAIRRO";
  taxaFixa: number | null;
  pedidoMinimo: number | null;
}

export interface ZonaAdmin {
  id: string;
  bairro: string;
  taxa: number;
  tempoEstimado: number | null;
  ativo: boolean;
}

export interface PedidoAdminResumo {
  id: string;
  numero: number;
  status: string;
  tipoEntrega: "RETIRADA" | "DELIVERY";
  formaPagamento: "PIX" | "DINHEIRO";
  total: number;
  criadoEm: string;
  clienteNome: string;
  clienteTelefone: string;
  /** true quando o pedido ainda pode ser cancelado (não entregue/cancelado). */
  podeCancelar: boolean;
}

export interface ClienteAdmin {
  id: string;
  nome: string;
  telefone: string;
  bloqueado: boolean;
  qtdPedidos: number;
}
