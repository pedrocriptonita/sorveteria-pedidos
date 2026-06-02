import { redirect } from "next/navigation";
import type { PapelUsuario } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

import "server-only";

/**
 * Usuário autenticado do backoffice: identidade do Supabase Auth + papel/dados
 * vindos da tabela UsuarioAdmin (fonte da verdade do papel e do flag `ativo`).
 */
export interface BackofficeUser {
  id: string;
  email: string;
  nome: string;
  papel: PapelUsuario;
}

/**
 * Retorna o usuário do backoffice logado, ou null se:
 *  - não há sessão válida no Supabase, ou
 *  - não existe UsuarioAdmin correspondente, ou
 *  - o usuário está inativo (`ativo = false`).
 *
 * Usa supabase.auth.getUser() (valida o JWT no servidor) — nunca getSession(),
 * que apenas lê o cookie sem verificar.
 */
export async function getBackofficeUser(): Promise<BackofficeUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = await prisma.usuarioAdmin.findUnique({
    where: { id: user.id },
  });

  if (!admin || !admin.ativo || admin.deletedAt) return null;

  return {
    id: admin.id,
    email: admin.email,
    nome: admin.nome,
    papel: admin.papel,
  };
}

/**
 * Exige um usuário logado. Redireciona para /login se não houver.
 * Use no topo de layouts/páginas de Server Component.
 */
export async function requireUser(): Promise<BackofficeUser> {
  const user = await getBackofficeUser();
  if (!user) redirect("/login");
  return user;
}

/** Exige papel ADMIN. COZINHA cai em /cozinha; sem sessão vai pra /login. */
export async function requireAdmin(): Promise<BackofficeUser> {
  const user = await requireUser();
  if (user.papel !== "ADMIN") redirect("/cozinha");
  return user;
}

/** Exige acesso à cozinha. ADMIN também passa (acesso total). */
export async function requireCozinha(): Promise<BackofficeUser> {
  const user = await requireUser();
  // ADMIN e COZINHA têm acesso ao KDS; nenhum outro papel existe hoje.
  return user;
}
