import { describe, expect, it } from "vitest";
import {
  calcularPreco,
  configValida,
  nomeTamanho,
  resumirOpcoes,
} from "./pricing";
import type {
  GrupoOpcaoView,
  ItemOpcaoView,
  ProdutoView,
  SelecaoConfig,
} from "./types";

// --------------------------------------------------------------------------
// Helpers de fixture — montam um ProdutoView mínimo para os testes.
// --------------------------------------------------------------------------
function item(
  id: string,
  precoExtra: number,
  disponivel = true,
): ItemOpcaoView {
  return { id, nome: id, precoExtra, disponivel };
}

function grupo(over: Partial<GrupoOpcaoView> & { id: string }): GrupoOpcaoView {
  return {
    nome: over.id,
    tipo: "MULTIPLO",
    min: 0,
    max: null,
    cotaGratis: 0,
    obrigatorio: false,
    itens: [],
    ...over,
  };
}

function montavel(grupos: GrupoOpcaoView[], precoBase = 18): ProdutoView {
  return {
    id: "p1",
    nome: "Açaí",
    descricao: null,
    foto: null,
    preco: null,
    montavel: true,
    disponivel: true,
    tamanhos: [{ id: "t500", nome: "500ml", precoBase }],
    grupos,
  };
}

function cfg(selecoes: Record<string, string[]>): SelecaoConfig {
  return { tamanhoId: "t500", selecoes };
}

// --------------------------------------------------------------------------

describe("calcularPreco — produto simples (não montável)", () => {
  it("usa o preço fixo e nunca tem erros", () => {
    const refri: ProdutoView = {
      id: "r1",
      nome: "Refrigerante",
      descricao: null,
      foto: null,
      preco: 7.5,
      montavel: false,
      disponivel: true,
      tamanhos: [],
      grupos: [],
    };
    const r = calcularPreco(refri, { tamanhoId: null, selecoes: {} });
    expect(r.precoUnitario).toBe(7.5);
    expect(r.erros).toEqual([]);
  });
});

describe("calcularPreco — cota grátis (regra do dinheiro)", () => {
  const acomp = grupo({
    id: "acomp",
    cotaGratis: 3,
    itens: [
      item("granola", 0),
      item("leitepo", 0),
      item("pacoca", 0),
      item("nutella", 5),
      item("morango", 3),
    ],
  });

  it("cobra os itens MAIS CAROS além da cota", () => {
    // base 18 + (5 itens, 3 grátis = os 3 mais baratos → cobra 3 + 5 = 8)
    const r = calcularPreco(
      montavel([acomp]),
      cfg({ acomp: ["granola", "leitepo", "pacoca", "nutella", "morango"] }),
    );
    expect(r.precoUnitario).toBe(26);
    expect(r.erros).toEqual([]);
  });

  it("não cobra nada quando a seleção cabe na cota", () => {
    const r = calcularPreco(
      montavel([acomp]),
      cfg({ acomp: ["nutella", "morango"] }), // 2 itens, cota 3
    );
    expect(r.precoUnitario).toBe(18);
  });
});

describe("calcularPreco — validações de grupo", () => {
  it("erro quando abaixo do mínimo", () => {
    const g = grupo({ id: "cremes", min: 2, itens: [item("a", 0), item("b", 0)] });
    const r = calcularPreco(montavel([g]), cfg({ cremes: ["a"] }));
    expect(r.erros.length).toBeGreaterThan(0);
  });

  it("erro quando acima do máximo", () => {
    const g = grupo({
      id: "cremes",
      max: 1,
      itens: [item("a", 0), item("b", 0)],
    });
    const r = calcularPreco(montavel([g]), cfg({ cremes: ["a", "b"] }));
    expect(r.erros.length).toBeGreaterThan(0);
  });

  it("erro quando obrigatório e nada selecionado", () => {
    const g = grupo({
      id: "creme",
      tipo: "UNICO",
      obrigatorio: true,
      itens: [item("a", 0), item("b", 0)],
    });
    const r = calcularPreco(montavel([g]), cfg({}));
    expect(r.erros.length).toBeGreaterThan(0);
    expect(configValida(montavel([g]), cfg({}))).toBe(false);
  });

  it("UNICO com 2 selecionados é inválido", () => {
    const g = grupo({
      id: "creme",
      tipo: "UNICO",
      itens: [item("a", 0), item("b", 0)],
    });
    const r = calcularPreco(montavel([g]), cfg({ creme: ["a", "b"] }));
    expect(r.erros.length).toBeGreaterThan(0);
  });
});

describe("calcularPreco — item indisponível", () => {
  it("ignora item esgotado no preço e na validação", () => {
    const g = grupo({
      id: "acomp",
      obrigatorio: true,
      itens: [item("esgotado", 5, false)],
    });
    const r = calcularPreco(montavel([g]), cfg({ acomp: ["esgotado"] }));
    // não soma os 5 do item esgotado...
    expect(r.precoUnitario).toBe(18);
    // ...e o obrigatório fica sem seleção válida → erro
    expect(r.erros.length).toBeGreaterThan(0);
  });
});

describe("resumirOpcoes / nomeTamanho", () => {
  it("resume só os grupos com seleção válida e devolve o nome do tamanho", () => {
    const g = grupo({
      id: "acomp",
      nome: "Acompanhamentos",
      itens: [item("granola", 0), item("morango", 3)],
    });
    const produto = montavel([g]);
    const c = cfg({ acomp: ["granola", "morango"] });
    expect(nomeTamanho(produto, c)).toBe("500ml");
    expect(resumirOpcoes(produto, c)).toEqual([
      { grupoNome: "Acompanhamentos", itens: ["granola", "morango"] },
    ]);
  });
});
