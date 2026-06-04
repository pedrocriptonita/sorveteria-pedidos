"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "produtos";

/** Extensões aceitas (apenas imagens). */
function extensaoValida(tipo: string) {
  return ["image/png", "image/jpeg", "image/webp", "image/gif"].includes(tipo);
}

/**
 * Faz upload de uma foto de produto para o Supabase Storage (bucket "produtos")
 * e salva a URL pública no campo `foto` do produto. Aceita PNG, JPEG, WEBP e GIF.
 * Retorna um objeto de erro se algo falhar (para exibir na UI).
 */
export async function uploadFotoProduto(
  fd: FormData,
): Promise<{ erro?: string }> {
  await requireAdmin();

  const id = String(fd.get("id") ?? "").trim();
  const arquivo = fd.get("foto") as File | null;

  if (!id) return { erro: "ID do produto ausente." };
  if (!arquivo || arquivo.size === 0)
    return { erro: "Nenhum arquivo selecionado." };
  if (!extensaoValida(arquivo.type))
    return { erro: "Formato inválido. Use PNG, JPEG ou WEBP." };
  if (arquivo.size > 5 * 1024 * 1024)
    return { erro: "Arquivo muito grande. Limite de 5 MB." };

  const supabase = createAdminClient();

  // Garante que o bucket existe e é público.
  const { data: buckets } = await supabase.storage.listBuckets();
  const existe = buckets?.some((b) => b.name === BUCKET);
  if (!existe) {
    const { error: errBucket } = await supabase.storage.createBucket(BUCKET, {
      public: true,
    });
    if (errBucket) return { erro: `Erro ao criar bucket: ${errBucket.message}` };
  }

  // Caminho: produtos/<id>.<ext>
  const ext = arquivo.name.split(".").pop() ?? "png";
  const caminho = `${id}.${ext}`;

  const bytes = await arquivo.arrayBuffer();
  const { error: errUpload } = await supabase.storage
    .from(BUCKET)
    .upload(caminho, bytes, {
      contentType: arquivo.type,
      upsert: true, // substitui se já existir
    });

  if (errUpload) return { erro: `Upload falhou: ${errUpload.message}` };

  // URL pública permanente
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(caminho);

  await prisma.produto.update({
    where: { id },
    data: { foto: urlData.publicUrl },
  });

  revalidatePath(`/admin/produto/${id}`);
  revalidatePath("/");
  return {};
}

/** Remove a foto do produto (Storage + campo no banco). */
export async function removerFotoProduto(
  fd: FormData,
): Promise<{ erro?: string }> {
  await requireAdmin();

  const id = String(fd.get("id") ?? "").trim();
  if (!id) return { erro: "ID do produto ausente." };

  const produto = await prisma.produto.findUnique({
    where: { id },
    select: { foto: true },
  });

  if (produto?.foto) {
    const supabase = createAdminClient();
    // Extrai o caminho dentro do bucket da URL pública
    const url = new URL(produto.foto);
    const partes = url.pathname.split(`/${BUCKET}/`);
    if (partes[1]) {
      await supabase.storage.from(BUCKET).remove([partes[1]]);
    }
  }

  await prisma.produto.update({ where: { id }, data: { foto: null } });
  revalidatePath(`/admin/produto/${id}`);
  revalidatePath("/");
  return {};
}
