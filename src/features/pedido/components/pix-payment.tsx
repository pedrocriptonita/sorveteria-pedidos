"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  pedidoId: string;
  qrCode: string | null;
  copiaCola: string | null;
}

export function PixPayment({ pedidoId, qrCode, copiaCola }: Props) {
  const router = useRouter();
  const [copiado, setCopiado] = useState(false);

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
    <div className="flex flex-col items-center gap-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Escaneie o QR Code ou copie o código para pagar. A confirmação é
        automática.
      </p>

      {qrCode ? (
        // eslint-disable-next-line @next/next/no-img-element -- QR vem como data URI do PSP
        <img
          src={qrCode}
          alt="QR Code PIX"
          className="h-56 w-56 rounded-md bg-white p-2"
        />
      ) : null}

      {copiaCola ? (
        <div className="flex w-full flex-col gap-2">
          <code className="block max-w-full overflow-x-auto rounded-md bg-neutral-100 px-3 py-2 text-xs dark:bg-neutral-800">
            {copiaCola}
          </code>
          <button
            type="button"
            onClick={copiar}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {copiado ? "Copiado!" : "Copiar código PIX"}
          </button>
        </div>
      ) : null}

      <p className="flex items-center gap-2 text-sm text-neutral-500">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-500" />
        Aguardando pagamento…
      </p>
    </div>
  );
}
