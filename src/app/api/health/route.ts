import { NextResponse } from "next/server";

// Sempre dinâmico: reflete o estado em tempo de requisição.
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "sorveteria-pedidos",
    env: process.env.NODE_ENV ?? "unknown",
    timestamp: new Date().toISOString(),
  });
}
