import type { StatusPedidoView, TipoEntrega } from "@/features/pedido/types";

/**
 * Próximo passo do pedido na cozinha (puro, sem servidor). Retorna o status
 * alvo + o rótulo do botão, ou null quando não há avanço pela cozinha.
 *
 * Fluxo: NA_FILA/IMPRESSO → EM_PREPARO → PRONTO →
 *   (DELIVERY) SAIU_PARA_ENTREGA → ENTREGUE
 *   (RETIRADA) ENTREGUE
 */
export interface ProximoPasso {
  proximo: StatusPedidoView;
  label: string;
}

export function proximoPasso(
  status: StatusPedidoView,
  tipoEntrega: TipoEntrega,
): ProximoPasso | null {
  switch (status) {
    case "NA_FILA":
    case "IMPRESSO":
      return { proximo: "EM_PREPARO", label: "Iniciar preparo" };
    case "EM_PREPARO":
      return { proximo: "PRONTO", label: "Marcar pronto" };
    case "PRONTO":
      return tipoEntrega === "DELIVERY"
        ? { proximo: "SAIU_PARA_ENTREGA", label: "Saiu para entrega" }
        : { proximo: "ENTREGUE", label: "Entregue" };
    case "SAIU_PARA_ENTREGA":
      return { proximo: "ENTREGUE", label: "Entregue" };
    default:
      return null;
  }
}
