/**
 * Horários de funcionamento da loja.
 *
 * Guardados em ConfigLoja.horarios (Json). Quando `ativo = false` (ou ausente),
 * a loja aceita pedidos a qualquer hora — só a pausa manual bloqueia. Com
 * `ativo = true`, o checkout respeita os horários por dia da semana.
 *
 * O cálculo de "agora" usa SEMPRE o fuso de Brasília (America/Sao_Paulo), pois
 * o servidor (Vercel) roda em UTC e daria horário errado.
 */

export interface HorarioDia {
  aberto: boolean;
  abre: string; // "HH:MM"
  fecha: string; // "HH:MM"
}

export interface Horarios {
  /** Se false, ignora os horários (loja aceita pedido a qualquer hora). */
  ativo: boolean;
  /** 7 dias; índice = dia da semana (0=Domingo … 6=Sábado). */
  dias: HorarioDia[];
}

const TZ = "America/Sao_Paulo";

export function horariosDefault(): Horarios {
  return {
    ativo: false,
    dias: Array.from({ length: 7 }, () => ({
      aberto: true,
      abre: "10:00",
      fecha: "22:00",
    })),
  };
}

/** Normaliza o JSON salvo (pode ser null/incompleto) num Horarios válido. */
export function parseHorarios(json: unknown): Horarios {
  const base = horariosDefault();
  if (!json || typeof json !== "object") return base;
  const h = json as Partial<Horarios>;
  const dias =
    Array.isArray(h.dias) && h.dias.length === 7
      ? h.dias.map((d, i) => ({
          aberto: typeof d?.aberto === "boolean" ? d.aberto : base.dias[i].aberto,
          abre: typeof d?.abre === "string" ? d.abre : base.dias[i].abre,
          fecha: typeof d?.fecha === "string" ? d.fecha : base.dias[i].fecha,
        }))
      : base.dias;
  return { ativo: Boolean(h.ativo), dias };
}

function paraMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** Dia da semana (0-6) e minutos do dia, no fuso de Brasília. */
function agoraBrasilia(now: Date): { dia: number; min: number } {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const wd = partes.find((p) => p.type === "weekday")?.value ?? "Sun";
  const hour = Number(partes.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(partes.find((p) => p.type === "minute")?.value ?? "0");
  const mapa: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return { dia: mapa[wd] ?? 0, min: hour * 60 + minute };
}

/** true se a loja está aberta agora, considerando os horários configurados. */
export function estaAberta(
  horarios: Horarios | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!horarios || !horarios.ativo) return true;
  const { dia, min } = agoraBrasilia(now);
  const d = horarios.dias[dia];
  if (!d || !d.aberto) return false;

  const abre = paraMinutos(d.abre);
  const fecha = paraMinutos(d.fecha);
  if (fecha > abre) return min >= abre && min < fecha; // mesmo dia
  if (fecha < abre) return min >= abre || min < fecha; // cruza a meia-noite
  return false; // abre == fecha → fechado
}
