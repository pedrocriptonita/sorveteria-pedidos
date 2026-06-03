# Slice: Checkout + Pedido + Pagamento (Fase 5)

DB: Cliente, Endereco, ZonaEntrega, ConfigLoja, Pedido, ItemPedido, Pagamento ·
Backend: criação de pedido, taxa, PIX/dinheiro · Frontend: checkout, pagamento
PIX, status.

## Implementado (Fase 5)

- `config.ts` — `getConfigLoja(View)`, `calcularTaxaEntrega` (FIXA/POR_BAIRRO).
- `pricing-server.ts` — `recomputarItens`: **recalcula o preço no servidor** a
  partir do catálogo (anti-fraude); o carrinho do client não é confiável.
- `actions.ts` — `criarPedido`: valida loja/mínimo/disponibilidade, cria
  cliente (find-or-create por telefone), endereço+snapshot, pedido+itens e
  pagamento. Dinheiro → `NA_FILA` + imprime; PIX → cobrança no PSP.
- `pagamento.ts` — confirmação idempotente: ao confirmar o PIX, transiciona o
  pedido para `NA_FILA` e enfileira a comanda. Usado por webhook, polling e
  status page. (Substitui o antigo `lib/psp/polling.ts`.)
- `comanda.ts` — monta o `ComandaPayload` a partir dos itens ou do pedido.
- `data.ts` — `getPedidoView` para a tela de status.
- UI: `components/checkout-form`, `components/pix-payment` (polling) e rotas
  `src/app/(loja)/checkout`, `/pedido/[id]` + `GET /api/pedido/[id]/status`.

## Decisões / pendências

- **PIX sem CPF do cliente** (estilo iFood): o Asaas exige um CPF/CNPJ na
  cobrança, então usamos o da loja (`PSP_CPF_CNPJ`) no adapter. O cliente não
  digita nada.
- Confirmação do pagamento em **dinheiro** (na entrega) e mudanças de status
  pela cozinha (EM_PREPARO/PRONTO/...) entram na Fase 6 (KDS).
- Substituição de item / estorno PIX → Fase 7 (admin).
