import type { OpcaoResumo } from "@/features/catalogo/types";
import type {
  FormaPagamento,
  StatusPedidoView,
  TipoEntrega,
} from "@/features/pedido/types";

export interface ItemCozinha {
  nome: string;
  quantidade: number;
  tamanho: string | null;
  opcoes: OpcaoResumo[];
  observacao: string | null;
}

/** Pedido como visto no painel da cozinha (KDS). */
export interface PedidoCozinha {
  id: string;
  numero: number;
  status: StatusPedidoView;
  tipoEntrega: TipoEntrega;
  formaPagamento: FormaPagamento;
  total: number;
  observacao: string | null;
  enderecoSnapshot: string | null;
  bairroSnapshot: string | null;
  criadoEm: string; // ISO
  /** Minutos desde a criação (calculado no fetch; atualiza a cada refresh). */
  esperaMin: number;
  itens: ItemCozinha[];
}

/** Job de impressão que precisa de atenção (monitor). */
export interface JobImpressaoView {
  id: string;
  pedidoId: string;
  pedidoNumero: number;
  status: "PENDENTE" | "IMPRESSO" | "ERRO";
  tentativas: number;
  ultimoErro: string | null;
  criadoEm: string; // ISO
}
