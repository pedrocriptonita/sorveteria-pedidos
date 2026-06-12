"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { uploadFotoProduto, removerFotoProduto } from "../foto-actions";

interface Props {
  produtoId: string;
  fotoAtual: string | null;
}

/**
 * Upload de foto de produto para o Supabase Storage.
 * Aceita PNG, JPEG e WEBP. Mostra preview antes de salvar.
 */
export function FotoUpload({ produtoId, fotoAtual }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [fileComprimido, setFileComprimido] = useState<File | null>(null);

  function comprimirImagem(file: File): Promise<File> {
    return new Promise((resolve) => {
      const img = document.createElement("img");
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const MAX = 800;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
          else { width = Math.round((width * MAX) / height); height = MAX; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => resolve(new File([blob!], file.name, { type: "image/jpeg" })),
          "image/jpeg",
          0.85,
        );
      };
      img.src = url;
    });
  }

  function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErro(null);
    comprimirImagem(file).then((comprimido) => {
      setFileComprimido(comprimido);
      setPreview(URL.createObjectURL(comprimido));
    });
  }

  function salvar() {
    if (!fileComprimido) return;
    const fd = new FormData();
    fd.append("id", produtoId);
    fd.append("foto", fileComprimido);

    startTransition(async () => {
      const res = await uploadFotoProduto(fd);
      if (res.erro) {
        setErro(res.erro);
      } else {
        setPreview(null);
        setFileComprimido(null);
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  }

  function remover() {
    const fd = new FormData();
    fd.append("id", produtoId);
    startTransition(async () => {
      const res = await removerFotoProduto(fd);
      if (res.erro) setErro(res.erro);
    });
  }

  const fotoExibida = preview ?? fotoAtual;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4">
      <p className="text-sm font-semibold">Foto do produto</p>

      {/* Preview / foto atual */}
      {fotoExibida ? (
        <div className="relative h-40 w-40 rounded-lg overflow-hidden border border-neutral-200 bg-[#fdf1f0]">
          <Image
            src={fotoExibida}
            alt="Foto do produto"
            fill
            className="object-contain p-2"
            sizes="160px"
            unoptimized={!!preview} // blob URL não passa pelo optimizer
          />
        </div>
      ) : (
        <div className="h-40 w-40 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 flex items-center justify-center text-neutral-400 text-3xl">
          🍧
        </div>
      )}

      {/* Controles */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="cursor-pointer rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-100 transition-colors">
          {fotoAtual || preview ? "Trocar foto" : "Selecionar foto"}
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={onSelectFile}
          />
        </label>

        {preview ? (
          <button
            type="button"
            onClick={salvar}
            disabled={pending}
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-700 disabled:opacity-60 transition-colors"
          >
            {pending ? "Salvando…" : "Salvar foto"}
          </button>
        ) : null}

        {fotoAtual && !preview ? (
          <button
            type="button"
            onClick={remover}
            disabled={pending}
            className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 transition-colors"
          >
            {pending ? "Removendo…" : "Remover foto"}
          </button>
        ) : null}
      </div>

      <p className="text-xs text-neutral-400">
        PNG, JPEG ou WEBP · máx. 5 MB · recomendado 400×400 px
      </p>

      {erro ? <p className="text-xs text-red-600">{erro}</p> : null}
    </div>
  );
}
