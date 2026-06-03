# Slice: Fila de impressão + KDS (Fase 6)

DB: FilaImpressao · Backend: enfileirar, retry, reimprimir, avanço de status ·
Frontend: KDS + monitor de impressão.

## Implementado (Fase 6)

- `status.ts` — `proximoPasso(status, tipoEntrega)`: fluxo da cozinha
  NA_FILA/IMPRESSO → EM_PREPARO → PRONTO → (delivery) SAIU_PARA_ENTREGA →
  ENTREGUE.
- `data.ts` — `getPedidosCozinha()` (fila ativa, FIFO, com tempo de espera) e
  `getMonitorImpressao()` (jobs PENDENTE/ERRO).
- `actions.ts` — `avancarStatusAction` (idempotente; confirma o dinheiro ao
  ENTREGAR) e `reimprimirAction` (novo job). Ambas exigem login de cozinha.
- UI: board em colunas (`/cozinha`), `pedido-cozinha-card`, monitor de
  impressão e `auto-refresh` (polling 7s).
- Integração: `marcarImpresso` (lib/print/queue) avança o pedido
  `NA_FILA → IMPRESSO` quando a comanda sai na cozinha.

## Decisões / pendências

- **Tempo real por polling** (não Supabase Realtime) — ver README raiz.
- Cancelar pedido, substituição de item e estorno PIX → Fase 7 (admin).
- O KDS é a rede de segurança quando a impressora está offline: o pedido fica
  visível mesmo com o job PENDENTE/ERRO.
