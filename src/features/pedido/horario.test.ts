import { describe, expect, it } from "vitest";
import { estaAberta, type Horarios } from "./horario";

// Brasil é UTC-3 o ano todo (sem horário de verão desde 2019), então datas em
// UTC abaixo são convertidas subtraindo 3h para o horário de Brasília.
function todosOsDias(
  dia: { aberto: boolean; abre: string; fecha: string },
  ativo = true,
): Horarios {
  return { ativo, dias: Array.from({ length: 7 }, () => ({ ...dia })) };
}

describe("estaAberta", () => {
  it("sem horários (null) → sempre aberta", () => {
    expect(estaAberta(null)).toBe(true);
  });

  it("ativo=false → sempre aberta (mesmo de madrugada)", () => {
    const h = todosOsDias({ aberto: false, abre: "10:00", fecha: "22:00" }, false);
    expect(estaAberta(h, new Date("2024-06-10T06:00:00Z"))).toBe(true);
  });

  it("dentro do horário (12:00 Brasília) → aberta", () => {
    const h = todosOsDias({ aberto: true, abre: "10:00", fecha: "22:00" });
    expect(estaAberta(h, new Date("2024-06-10T15:00:00Z"))).toBe(true);
  });

  it("fora do horário (23:00 Brasília) → fechada", () => {
    const h = todosOsDias({ aberto: true, abre: "10:00", fecha: "22:00" });
    expect(estaAberta(h, new Date("2024-06-11T02:00:00Z"))).toBe(false);
  });

  it("dia marcado como fechado → fechada", () => {
    const h = todosOsDias({ aberto: false, abre: "10:00", fecha: "22:00" });
    expect(estaAberta(h, new Date("2024-06-10T15:00:00Z"))).toBe(false);
  });

  it("vira a noite (18:00–02:00): 01:00 aberta, 03:00 fechada", () => {
    const h = todosOsDias({ aberto: true, abre: "18:00", fecha: "02:00" });
    expect(estaAberta(h, new Date("2024-06-10T04:00:00Z"))).toBe(true); // 01:00
    expect(estaAberta(h, new Date("2024-06-10T06:00:00Z"))).toBe(false); // 03:00
  });
});
