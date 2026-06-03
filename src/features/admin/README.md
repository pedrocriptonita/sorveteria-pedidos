# Slice: Admin — configurações e operação (Fase 7)

DB: Banner + ajustes em ConfigLoja/ZonaEntrega · Backend: config, zonas,
banners, substituição (mesmo valor), estorno total PIX · Frontend: painel admin.

## Implementado (Fase 7 — parte 1: CRUD do catálogo)

- `data.ts` — leituras do admin (mostram inativos/indisponíveis; ocultam só
  soft-deletados): `getCategoriasComProdutos`, `getProdutoAdmin`.
- `actions.ts` — ações CRUD (todas `requireAdmin` + `revalidatePath`):
  - Categorias: criar, renomear, ativar/desativar, mover (↑/↓), excluir.
  - Produtos: criar (simples/montável), editar, esgotar/disponibilizar, excluir.
  - Montável: tamanhos, grupos de opções e itens (criar/editar/remover, esgotar).
- Páginas: `/admin` (home), `/admin/catalogo` (gestão), `/admin/produto/[id]`
  (editor do montável). Tudo via `<form action={serverAction}>` (server
  components, sem estado client).

Exclusões são **soft-delete** (preservam o histórico de pedidos).

## Implementado (Fase 7 — parte 2: config + operação)

- `operacao-data.ts` — leituras: config (com `garantirConfig`), zonas, pedidos
  recentes, clientes (com contagem de pedidos).
- `config-actions.ts` — salvar config, **pausar/retomar** pedidos, CRUD de
  `ZonaEntrega`.
- `operacao-actions.ts` — **cancelar pedido** (estorno total do PIX pago via
  `getPsp().estornar`; cancela a cobrança se ainda aguardando) e
  **bloquear/desbloquear cliente**.
- PSP: `estornar` e `cancelarCobranca` adicionados ao contrato + adapter Asaas.
- Páginas: `/admin/config`, `/admin/pedidos`, `/admin/clientes`.

## Pendente (polimento)

- **Banner** (CRUD + exibição no cardápio) e **horários** de funcionamento.
- **Substituição de item** (mesmo valor) num pedido.
- Upload de fotos de produto (Supabase Storage).
- Feedback de erro do estorno na UI (hoje vai para o log do servidor).
