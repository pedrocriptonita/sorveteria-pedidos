# Slice: Catálogo + Monte seu açaí + Carrinho (Fase 4)

DB: Categoria, Produto, Tamanho, GrupoOpcao, ItemOpcao · Backend: leitura do
cardápio + motor de preço · Frontend: cardápio, montagem, carrinho.

## Implementado (Fase 4)

- `types.ts` — tipos serializáveis (Decimal → number) do domínio + carrinho.
- `pricing.ts` — **motor de preço puro/isomórfico** (`calcularPreco`,
  `configValida`, `resumirOpcoes`). Regra da cota grátis: os `cotaGratis` itens
  mais baratos do grupo saem de graça.
- `data.ts` — leitura do cardápio (server): `getCardapio()`, `getProduto(id)`.
  Filtra ativo/disponível/não-deletado.
- `cart/cart-provider.tsx` — carrinho via Context + `localStorage` (hidratação
  SSR-safe com `useSyncExternalStore`).
- `components/` — `store-header`, `produto-card`, `montagem-form`.
- Rotas em `src/app/(loja)/`: `/` (cardápio), `/produto/[id]` (montagem),
  `/carrinho`.

## Pendente

- **CRUD admin** do catálogo + upload de fotos (Supabase Storage) → Fase 7.
- Revalidação do preço no servidor ao fechar o pedido → Fase 5.
