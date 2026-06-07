"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Props {
  pedidoId: string;
  qrCode: string | null;
  copiaCola: string | null;
  /** Quando o código PIX expira (ISO). null = sem prazo conhecido. */
  expiraEm: string | null;
}

/** Formata segundos restantes como "m:ss". */
function mmss(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function PixPayment({ pedidoId, qrCode, copiaCola, expiraEm }: Props) {
  const router = useRouter();
  const [copiado, setCopiado] = useState(false);
  // Contador regressivo (segundos restantes). null = sem prazo / antes de montar
  // (começa null para o 1º render bater com o SSR; o efeito atualiza ao montar).
  const [restante, setRestante] = useState<number | null>(null);

  // Tempo real de expiração do QR Code (atualiza a cada 1s).
  useEffect(() => {
    if (!expiraEm) return;
    const alvo = new Date(expiraEm).getTime();
    function atualizar() {
      setRestante(Math.max(0, Math.round((alvo - Date.now()) / 1000)));
    }
    atualizar();
    const id = setInterval(atualizar, 1000);
    return () => clearInterval(id);
  }, [expiraEm]);

  const expirado = restante !== null && restante <= 0;

  // Polling do status: confirma via webhook OU checagem ao vivo no PSP.
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/pedido/${pedidoId}/status`, {
          cache: "no-store",
        });
        const data = (await res.json()) as { pago?: boolean };
        if (data.pago) {
          clearInterval(id);
          router.refresh(); // recarrega a página (server) já confirmada
        }
      } catch {
        // tenta de novo no próximo tick
      }
    }, 4000);
    return () => clearInterval(id);
  }, [pedidoId, router]);

  async function copiar() {
    if (!copiaCola) return;
    try {
      await navigator.clipboard.writeText(copiaCola);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // navegador sem clipboard — usuário copia manualmente
    }
  }

  return (
    <Card className="flex flex-col items-center gap-4 p-4">
      <p className="text-sm text-muted-foreground">
        Escaneie o QR Code ou copie o código para pagar. A confirmação é
        automática.
      </p>

      {qrCode ? (
        // eslint-disable-next-line @next/next/no-img-element -- QR vem como data URI do PSP
        <img
          src={qrCode}
          alt="QR Code PIX"
          className="h-56 w-56 rounded-md border border-border bg-white p-2"
        />
      ) : null}

      {copiaCola ? (
        <div className="flex w-full flex-col gap-2">
          <code className="block max-w-full overflow-x-auto rounded-md bg-muted px-3 py-2 text-xs">
            {copiaCola}
          </code>
          <Button type="button" className="w-full" onClick={copiar}>
            {copiado ? "Copiado!" : "Copiar código PIX"}
          </Button>
        </div>
      ) : null}

      {expirado ? (
        <p className="text-center text-sm font-medium text-destructive">
          Código PIX expirado. Faça um novo pedido para gerar outro.
        </p>
      ) : (
        <div className="flex flex-col items-center gap-1.5">
          {restante !== null ? (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${
                restante <= 60
                  ? "bg-destructive/10 text-destructive"
                  : "bg-accent text-accent-foreground"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                timer
              </span>
              Expira em {mmss(restante)}
            </span>
          ) : null}
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
            Aguardando pagamento…
          </p>
        </div>
      )}
    </Card>
  );
}
