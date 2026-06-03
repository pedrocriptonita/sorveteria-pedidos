import { NextResponse } from "next/server";
import { validarAgente } from "@/lib/print/auth";
import { marcarErro, marcarImpresso } from "@/lib/print/queue";

export const dynamic = "force-dynamic";

/**
 * O agente reporta o resultado da impressão de um job.
 * Body: { status: "IMPRESSO" } ou { status: "ERRO", erro: "..." }.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!validarAgente(req)) {
    return NextResponse.json({ error: "Agente não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    status?: string;
    erro?: string;
  };

  if (body.status === "IMPRESSO") {
    const job = await marcarImpresso(id);
    if (!job) {
      return NextResponse.json({ error: "Job não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, job });
  }

  if (body.status === "ERRO") {
    const job = await marcarErro(id, body.erro ?? "erro não informado");
    if (!job) {
      return NextResponse.json({ error: "Job não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, job });
  }

  return NextResponse.json(
    { error: "status inválido (use IMPRESSO ou ERRO)." },
    { status: 400 },
  );
}
