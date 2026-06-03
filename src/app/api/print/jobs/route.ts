import { NextResponse } from "next/server";
import { validarAgente } from "@/lib/print/auth";
import { buscarJobsPendentes } from "@/lib/print/queue";

export const dynamic = "force-dynamic";

/**
 * O agente local faz polling aqui para buscar comandas a imprimir.
 * Auth: Bearer PRINT_AGENT_TOKEN (ou header x-print-token).
 */
export async function GET(req: Request) {
  if (!validarAgente(req)) {
    return NextResponse.json({ error: "Agente não autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = Number(searchParams.get("limit") ?? "20");
  const limit = Number.isFinite(parsed) && parsed > 0 ? parsed : 20;

  const jobs = await buscarJobsPendentes(limit);
  return NextResponse.json({ jobs });
}
