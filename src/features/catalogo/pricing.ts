import type {
  GrupoOpcaoView,
  OpcaoResumo,
  ProdutoView,
  SelecaoConfig,
} from "./types";

/**
 * Motor de preço do "monte seu açaí" — PURO (sem servidor/DB), para calcular o
 * preço ao vivo na tela de montagem, no carrinho e (na Fase 5) revalidar no
 * servidor antes de fechar o pedido.
 *
 * Regra da COTA GRÁTIS (cotaGratis) de um grupo:
 *   Os itens selecionados são ordenados por preço crescente; os `cotaGratis`
 *   MAIS BARATOS saem de graça e os demais (os mais caros / "premium") são
 *   cobrados pelo seu precoExtra. Ex.: cota 3 e seleção [0, 0, 0, 2, 5] → cobra
 *   2 + 5 = 7. Decisão de negócio — fácil de inverter aqui se a loja preferir.
 */

export interface ResultadoPreco {
  precoUnitario: number;
  /** Mensagens de validação (min/max/obrigatório). Vazio = config válida. */
  erros: string[];
}

/** Itens realmente válidos selecionados num grupo (existentes e disponíveis). */
function itensSelecionadosValidos(grupo: GrupoOpcaoView, ids: string[]) {
  return grupo.itens.filter((it) => ids.includes(it.id) && it.disponivel);
}

/** Soma dos extras cobrados num grupo, aplicando a cota grátis. */
function extrasDoGrupo(grupo: GrupoOpcaoView, ids: string[]): number {
  const precos = itensSelecionadosValidos(grupo, ids)
    .map((it) => it.precoExtra)
    .sort((a, b) => a - b); // mais baratos primeiro (saem de graça)

  return precos.slice(grupo.cotaGratis).reduce((soma, p) => soma + p, 0);
}

/** Valida um grupo e retorna mensagens de erro (vazio = ok). */
function validarGrupo(grupo: GrupoOpcaoView, ids: string[]): string[] {
  const erros: string[] = [];
  const qtd = itensSelecionadosValidos(grupo, ids).length;

  if (grupo.obrigatorio && qtd < Math.max(1, grupo.min)) {
    erros.push(`Escolha em "${grupo.nome}".`);
  } else if (qtd < grupo.min) {
    erros.push(`Escolha ao menos ${grupo.min} em "${grupo.nome}".`);
  }

  if (grupo.max !== null && qtd > grupo.max) {
    erros.push(`Escolha no máximo ${grupo.max} em "${grupo.nome}".`);
  }
  if (grupo.tipo === "UNICO" && qtd > 1) {
    erros.push(`Escolha apenas uma opção em "${grupo.nome}".`);
  }

  return erros;
}

/** Calcula o preço unitário do produto configurado + erros de validação. */
export function calcularPreco(
  produto: ProdutoView,
  config: SelecaoConfig,
): ResultadoPreco {
  if (!produto.montavel) {
    return { precoUnitario: produto.preco ?? 0, erros: [] };
  }

  const erros: string[] = [];

  // Base: tamanho escolhido.
  const tamanho = produto.tamanhos.find((t) => t.id === config.tamanhoId);
  if (produto.tamanhos.length > 0 && !tamanho) {
    erros.push("Escolha o tamanho.");
  }
  let preco = tamanho?.precoBase ?? 0;

  // Grupos de opções.
  for (const grupo of produto.grupos) {
    const ids = config.selecoes[grupo.id] ?? [];
    erros.push(...validarGrupo(grupo, ids));
    preco += extrasDoGrupo(grupo, ids);
  }

  return { precoUnitario: preco, erros };
}

/** true se a configuração está completa e válida (habilita "adicionar"). */
export function configValida(
  produto: ProdutoView,
  config: SelecaoConfig,
): boolean {
  return calcularPreco(produto, config).erros.length === 0;
}

/** Monta o resumo legível das opções escolhidas (para carrinho/comanda). */
export function resumirOpcoes(
  produto: ProdutoView,
  config: SelecaoConfig,
): OpcaoResumo[] {
  const resumo: OpcaoResumo[] = [];
  for (const grupo of produto.grupos) {
    const ids = config.selecoes[grupo.id] ?? [];
    const nomes = itensSelecionadosValidos(grupo, ids).map((it) => it.nome);
    if (nomes.length > 0) resumo.push({ grupoNome: grupo.nome, itens: nomes });
  }
  return resumo;
}

/** Nome do tamanho escolhido (para snapshot no carrinho). */
export function nomeTamanho(
  produto: ProdutoView,
  config: SelecaoConfig,
): string | null {
  return produto.tamanhos.find((t) => t.id === config.tamanhoId)?.nome ?? null;
}
