import "server-only";
import { env } from "@/lib/env";
import { asaasProvider } from "./asaas";
import { mercadoPagoProvider } from "./mercadopago";
import type { PspProvider } from "./types";

export type { Cobranca, CriarCobrancaInput, EventoWebhook, PspProvider } from "./types";

/**
 * Retorna o provider de PSP configurado em PSP_PROVIDER.
 * Hoje só Asaas está implementado; os demais entram quando necessários.
 */
export function getPsp(): PspProvider {
  switch (env.pspProvider) {
    case "asaas":
      return asaasProvider;
    case "mercadopago":
      return mercadoPagoProvider;
    default:
      throw new Error(
        `PSP não implementado: "${env.pspProvider}". Use PSP_PROVIDER=asaas ou PSP_PROVIDER=mercadopago.`,
      );
  }
}
