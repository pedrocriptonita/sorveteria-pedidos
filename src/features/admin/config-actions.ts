"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { garantirConfig } from "./operacao-data";

function str(fd: FormData, k: string): string {
  return String(fd.get(k) ?? "").trim();
}
function numeroOpc(fd: FormData, k: string): number | null {
  const v = str(fd, k);
  return v ? Number(v.replace(",", ".")) : null;
}

const CONFIG = "/admin/config";

// ===========================================================================
// CONFIG DA LOJA
// ===========================================================================
export async function salvarConfigLoja(fd: FormData) {
  await requireAdmin();
  const config = await garantirConfig();
  await prisma.configLoja.update({
    where: { id: config.id },
    data: {
      nomeLoja: str(fd, "nomeLoja") || null,
      tipoTaxa: str(fd, "tipoTaxa") === "POR_BAIRRO" ? "POR_BAIRRO" : "FIXA",
      taxaFixa: numeroOpc(fd, "taxaFixa"),
      pedidoMinimo: numeroOpc(fd, "pedidoMinimo"),
    },
  });
  revalidatePath(CONFIG);
}

/** Pausa/retoma os pedidos (botão de pânico do dia a dia). */
export async function togglePausado() {
  await requireAdmin();
  const config = await garantirConfig();
  await prisma.configLoja.update({
    where: { id: config.id },
    data: { pausado: !config.pausado },
  });
  revalidatePath(CONFIG);
}

// ===========================================================================
// ZONAS DE ENTREGA (taxa POR_BAIRRO)
// ===========================================================================
export async function criarZona(fd: FormData) {
  await requireAdmin();
  const bairro = str(fd, "bairro");
  const taxa = numeroOpc(fd, "taxa");
  if (!bairro || taxa === null) return;
  await prisma.zonaEntrega.create({
    data: { bairro, taxa, tempoEstimado: numeroOpc(fd, "tempoEstimado") },
  });
  revalidatePath(CONFIG);
}

export async function editarZona(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const taxa = numeroOpc(fd, "taxa");
  if (!id || taxa === null) return;
  await prisma.zonaEntrega.update({
    where: { id },
    data: {
      bairro: str(fd, "bairro"),
      taxa,
      tempoEstimado: numeroOpc(fd, "tempoEstimado"),
    },
  });
  revalidatePath(CONFIG);
}

export async function toggleZonaAtivo(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const zona = await prisma.zonaEntrega.findUnique({ where: { id } });
  if (!zona) return;
  await prisma.zonaEntrega.update({
    where: { id },
    data: { ativo: !zona.ativo },
  });
  revalidatePath(CONFIG);
}

export async function excluirZona(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  if (!id) return;
  await prisma.zonaEntrega.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  revalidatePath(CONFIG);
}
