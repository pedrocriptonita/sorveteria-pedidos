"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export interface LoginState {
  error?: string;
}

/**
 * Server Action de login (email + senha via Supabase Auth).
 * Pensada para useActionState: recebe o estado anterior + FormData.
 *
 * Após autenticar, confirma que existe um UsuarioAdmin ativo e redireciona
 * conforme o papel (ADMIN → /admin, COZINHA → /cozinha) ou para `next`.
 */
export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  const next = String(formData.get("next") ?? "");

  if (!email || !senha) {
    return { error: "Informe email e senha." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (error || !data.user) {
    return { error: "Email ou senha inválidos." };
  }

  // Confirma que é um usuário do backoffice e está ativo.
  const admin = await prisma.usuarioAdmin.findUnique({
    where: { id: data.user.id },
  });

  if (!admin || !admin.ativo || admin.deletedAt) {
    await supabase.auth.signOut();
    return { error: "Acesso não autorizado para este usuário." };
  }

  revalidatePath("/", "layout");

  if (next && next.startsWith("/")) redirect(next);
  redirect(admin.papel === "ADMIN" ? "/admin" : "/cozinha");
}

/** Encerra a sessão e volta para o login. */
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
