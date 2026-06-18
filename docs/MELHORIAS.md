# Plano de Melhorias — pós Fase 9 (production-ready)

> Avaliação técnica do projeto (jun/2026) com plano priorizado para deixar o
> DevoraFood enxuto, profissional e pronto para produção. Implementar **após a
> Fase 9 (polimento)**. Itens marcados ✅ já foram aplicados.

## Avaliação (0–10)

| Critério | Nota | Resumo |
|----------|:----:|--------|
| Estrutura e organização | 9.0 | Feature-slicing claro (`catalogo`/`pedido`/`impressao`/`admin`) com `data.ts`/`actions.ts`/`types.ts`; `server-only` na fronteira. |
| Qualidade de código | 8.0 | TS estrito e consistente, motor de preço puro. Perde por duplicação e falta de validação de entrada. |
| Documentação | 7.5 | README completo, bons comentários — mas formato "diário de fases" desatualizado (marca/estado). |
| Boas práticas | 7.5 | `requireAdmin` nas actions, recálculo de preço no servidor, `getUser()`, soft-delete, snapshots, webhook idempotente. Falta validação/testes/rate-limit. |
| Segurança e performance | 7.0 | RLS deny-by-default, segredos server-only. Furos: tabela nova sem RLS (corrigido), sem rate-limit, N+1 (corrigido), token comparado com `!==`. |

**Média ~7.8/10.** Base sólida; falta a camada de *hardening*.

---

## 🔴 CRÍTICO

### C1. RLS em toda tabela nova ✅ FEITO
- **O quê:** habilitar RLS em `subcategorias` (e em qualquer tabela futura).
- **Por quê:** o Supabase expõe `/rest/v1/<tabela>` com a chave anônima (browser). Sem RLS = leitura/escrita pública.
- **Como:** adicionado em `prisma/rls.sql` + `npm run db:rls`.
- **Regra permanente:** ao criar tabela no `schema.prisma`, adicionar `ALTER TABLE public.<tabela> ENABLE ROW LEVEL SECURITY;` no `rls.sql` e rodar `npm run db:rls`.

### C2. Rate-limit / anti-abuso em `criarPedido` ✅ FEITO
- **O quê:** limitar criação de pedido por cliente (e idealmente IP).
- **Por quê:** server action **pública** que cria cobranças no Asaas; sem limite, um bot gera centenas de cobranças (custo/risco) e polui o KDS.
- **Feito:** bloqueio de novo pedido enquanto houver `AGUARDANDO_PAGAMENTO` do mesmo cliente nos últimos 60s (`src/features/pedido/actions.ts`).
- **Falta (produção):** complementar com rate-limit por IP (ex.: `@upstash/ratelimit`), pois telefone é forjável. Código de referência:
  ```ts
  const recente = await prisma.pedido.findFirst({
    where: {
      clienteId: cliente.id,
      status: "AGUARDANDO_PAGAMENTO",
      createdAt: { gte: new Date(Date.now() - 60_000) },
    },
    select: { id: true },
  });
  if (recente) {
    return { ok: false, erro: "Você já tem um pedido aguardando pagamento. Conclua-o antes de criar outro." };
  }
  ```
  Produção: complementar com rate-limit por IP (ex.: `@upstash/ratelimit`).

---

## 🟠 ALTO

### A1. Validação de entrada com Zod (actions + webhooks) ✅ FEITO
- **O quê:** validar payload de `criarPedido` e body dos webhooks com schema.
- **Por quê:** hoje confia-se na forma do objeto do client/PSP. Preço já é recalculado, mas dados malformados (telefone, observação gigante) entram sem checagem.
- **Feito (checkout):** `zod@4` promovido a dependência direta; `src/features/pedido/schema.ts` (`checkoutSchema`) com `.safeParse()` no topo de `criarPedido`.
- **Feito (webhooks):** `asaasWebhookSchema` em `src/lib/psp/asaas.ts` (`validarWebhook`) e `zapiWebhookSchema` em `src/app/api/webhooks/whatsapp/route.ts` — ambos com `.safeParse()` (rejeitam payload malformado com 400/null).
- **Referência do schema:**
  ```ts
  import { z } from "zod";
  export const checkoutSchema = z.object({
    cliente: z.object({
      nome: z.string().trim().min(2).max(80),
      telefone: z.string().trim().min(8).max(20),
    }),
    tipoEntrega: z.enum(["RETIRADA", "DELIVERY"]),
    endereco: z.object({
      endereco: z.string().trim().min(3).max(160),
      complemento: z.string().max(120).optional(),
      referencia: z.string().max(120).optional(),
      bairro: z.string().max(80).optional(),
    }).optional(),
    formaPagamento: z.enum(["PIX", "DINHEIRO"]),
    trocoPara: z.number().positive().optional(),
    observacao: z.string().max(500).optional(),
    linhas: z.array(z.object({
      produtoId: z.string().uuid(),
      quantidade: z.number().int().min(1).max(99),
      config: z.object({
        tamanhoId: z.string().uuid().nullable(),
        selecoes: z.record(z.string(), z.array(z.string())),
      }),
    })).min(1).max(50),
  });
  ```
  No topo de `criarPedido`:
  ```ts
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, erro: "Dados do pedido inválidos." };
  const dados = parsed.data; // usar no lugar de `input`
  ```

### A2. N+1 no checkout / `repetir` ✅ FEITO
- **O quê:** buscar produtos em uma query (lote) em vez de 1 por item.
- **Feito:** `getProdutosByIds` em `recomputarItens` (checkout) **e** em `repetirPedido` (`src/features/pedido/historico-actions.ts`).

### A3. Testes do que é crítico e puro ✅ FEITO (motor de preço)
- **O quê:** unit tests do motor de preço (`pricing.ts`).
- **Feito:** `vitest` + `src/features/catalogo/pricing.test.ts` (9 testes: cota grátis cobra os mais caros, mín/máx, obrigatório, UNICO, item esgotado, resumo/tamanho). Scripts `npm test` / `npm run test:watch`; passo **Test** no CI.
- **Falta (opcional):** testar mapeamento de status do PSP (`asaas.ts mapStatus`).

---

## 🟡 MÉDIO

### M1. Comparação de token em tempo constante ✅ FEITO
- Webhook PSP (`src/lib/psp/asaas.ts`) e print (`src/lib/print/auth.ts`) usavam `!==`.
- **Feito:** helper `secureEqual()` em `src/lib/secure-compare.ts` (usa `crypto.timingSafeEqual`) aplicado nos dois pontos.

### M2. De-duplicar constantes ✅ FEITO
- ✅ `CLIENTE_KEY` + helpers em `src/features/pedido/storage.ts` (`lerClienteSalvo`/`salvarCliente`), usados por `checkout-form.tsx` e `pedidos-hub.tsx`.
- ✅ Rótulos em `src/features/pedido/status.ts` (`STATUS_LABEL_CURTO` p/ admin+histórico, `STATUS_LABEL_CLIENTE` p/ tela de status), usados nos 3 pontos.
- Bônus: removido import morto (`formatBRL`) — lint 100% limpo.

### M3. Higiene de repo/CI ✅ FEITO
- ✅ `dev-server.log` removido do git + `*.log` no `.gitignore`.
- ✅ CI: `npm install` → `npm ci`; passo de generate usa `npx prisma generate` (sem dotenv).

### M4. README como doc de produto ✅ FEITO
- ✅ README enxuto e orientado a produto (Funcionalidades, Stack, Como rodar, Scripts, Estrutura, Deploy, Roadmap); marca **DevoraFood**.
- ✅ Diário de fases ("Como testar a Fase X") movido para `docs/FASES.md`.

---

## 🟢 BAIXO
- Headers de segurança (CSP, `X-Frame-Options`, `Referrer-Policy`) em `next.config.ts`.
- `error.tsx` / `not-found.tsx` por rota (UX de erro).
- Observabilidade: Sentry ou log estruturado no lugar de `console.error`.
- A11y: foco visível e `aria-*` nos toggles (acordeão de subcategoria, abas).
- Mover `landing-vendas.html` para fora do root da app (ou `/public/landing/`).

---

## Ordem sugerida de execução
C1 ✅ → C2 ✅ → M1 ✅ → A1 ✅(checkout) → A2 ✅ → M3 ✅ → A3 ✅(motor) → M2 ✅ → M4 ✅ → A1 ✅(webhooks) → 🟢 baixos.

> Concluído também: headers de segurança no `next.config.ts`, `error.tsx`/`not-found.tsx`.
> Restam só 🟢 baixos opcionais: rate-limit por IP (produção), observabilidade/Sentry,
> a11y refinada, mover `landing-vendas.html` para fora do root.
