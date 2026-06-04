"use client";

import { useState, useTransition } from "react";
import { enviarDetalhesWhatsapp } from "../whatsapp-action";
import { Button } from "@/components/ui/button";

export function WhatsappButton({ pedidoId }: { pedidoId: string }) {
  const [pending, startTransition] = useTransition();
  const [estado, setEstado] = useState<"idle" | "ok" | "erro">("idle");
  const [erro, setErro] = useState<string | null>(null);

  function enviar() {
    startTransition(async () => {
      const res = await enviarDetalhesWhatsapp(pedidoId);
      if (res.ok) {
        setEstado("ok");
      } else {
        setEstado("erro");
        setErro(res.erro ?? "Erro desconhecido.");
      }
    });
  }

  if (estado === "ok") {
    return (
      <p className="flex items-center gap-2 rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
        <span aria-hidden>✅</span> Detalhes enviados no WhatsApp!
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        className="w-full gap-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10"
        onClick={enviar}
        disabled={pending}
      >
        <span aria-hidden>📲</span>
        {pending ? "Enviando…" : "Receber detalhes no WhatsApp"}
      </Button>
      {estado === "erro" && erro ? (
        <p className="text-sm text-destructive">{erro}</p>
      ) : null}
    </div>
  );
}
