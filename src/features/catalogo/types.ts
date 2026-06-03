/**
 * Tipos do domínio de catálogo, já "serializáveis" (Decimal → number) para
 * trafegarem do servidor para Client Components. Espelham o schema Prisma, mas
 * só com o que a vitrine precisa.
 */

export type TipoGrupo = "UNICO" | "MULTIPLO";
export type TipoEntregaView = "RETIRADA" | "DELIVERY";

export interface ItemOpcaoView {
  id: string;
  nome: string;
  precoExtra: number;
  disponivel: boolean;
}

export interface GrupoOpcaoView {
  id: string;
  nome: string;
  tipo: TipoGrupo;
  min: number;
  max: number | null;
  cotaGratis: number;
  obrigatorio: boolean;
  itens: ItemOpcaoView[];
}

export interface TamanhoView {
  id: string;
  nome: string;
  precoBase: number;
}

export interface ProdutoView {
  id: string;
  nome: string;
  descricao: string | null;
  foto: string | null;
  preco: number | null; // usado quando montavel = false
  montavel: boolean;
  disponivel: boolean;
  tamanhos: TamanhoView[];
  grupos: GrupoOpcaoView[];
}

export interface CategoriaView {
  id: string;
  nome: string;
  produtos: ProdutoView[];
}

// ---------------------------------------------------------------------------
// Seleção (montagem) e carrinho
// ---------------------------------------------------------------------------

/** Configuração escolhida pelo cliente para um produto. */
export interface SelecaoConfig {
  /** Tamanho escolhido (produtos montáveis). null para produto simples. */
  tamanhoId: string | null;
  /** grupoId → ids dos itens selecionados naquele grupo. */
  selecoes: Record<string, string[]>;
}

/** Resumo legível de um grupo para exibir no carrinho / comanda. */
export interface OpcaoResumo {
  grupoNome: string;
  itens: string[];
}

/** Uma linha do carrinho (um produto configurado, com quantidade). */
export interface CartItem {
  /** Id único da linha (permite o mesmo produto configurado de formas diferentes). */
  linhaId: string;
  produtoId: string;
  nomeProduto: string;
  montavel: boolean;
  tamanhoNome: string | null;
  opcoesResumo: OpcaoResumo[];
  quantidade: number;
  precoUnitario: number;
  /** Config crua, para permitir editar a linha depois. */
  config: SelecaoConfig;
}
