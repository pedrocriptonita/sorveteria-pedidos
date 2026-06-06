import type { StatusPedidoView } from "./types";

/**
 * Rótulos de status do pedido, centralizados para não duplicar entre telas.
 *  - CURTO: usado no admin e no histórico do cliente (lista compacta).
 *  - CLIENTE: copy mais amigável da tela de acompanhamento do pedido.
 */
export const STATUS_LABEL_CURTO: Record<StatusPedidoView, string> = {
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  PAGO: "Pago",
  NA_FILA: "Na fila",
  IMPRESSO: "Em preparo",
  EM_PREPARO: "Em preparo",
  PRONTO: "Pronto",
  SAIU_PARA_ENTREGA: "Saiu p/ entrega",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
};

export const STATUS_LABEL_CLIENTE: Record<StatusPedidoView, string> = {
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  PAGO: "Pagamento confirmado",
  NA_FILA: "Pedido confirmado — na fila",
  IMPRESSO: "Em preparo",
  EM_PREPARO: "Em preparo",
  PRONTO: "Pronto!",
  SAIU_PARA_ENTREGA: "Saiu para entrega",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
};
