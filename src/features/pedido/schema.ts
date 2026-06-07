import { z } from "zod";

/**
 * Schema de validação do payload do checkout (vem do client → NÃO confiável).
 * Garante forma + limites (tamanho de texto, qtd de itens) antes de qualquer
 * lógica de negócio. Os PREÇOS continuam sendo recalculados no servidor
 * (`recomputarItens`); aqui validamos apenas a estrutura/limites de entrada.
 *
 * Ids usam min/max em vez de `.uuid()` estrito para não rejeitar por engano se
 * o formato de id mudar no futuro — a existência real é checada no banco.
 */
const idSchema = z.string().min(1).max(64);

export const checkoutSchema = z.object({
  cliente: z.object({
    // min(1): alinha com o login leve (nome não-vazio); evita rejeitar pedido
    // de cliente com nome curto salvo no localStorage.
    nome: z.string().trim().min(1).max(80),
    telefone: z.string().trim().min(8).max(20),
  }),
  tipoEntrega: z.enum(["RETIRADA", "DELIVERY"]),
  endereco: z
    .object({
      endereco: z.string().trim().min(3).max(160),
      complemento: z.string().max(120).optional(),
      referencia: z.string().max(120).optional(),
      bairro: z.string().max(80).optional(),
    })
    .optional(),
  formaPagamento: z.enum(["PIX", "DINHEIRO"]),
  trocoPara: z.number().positive().max(100_000).optional(),
  observacao: z.string().max(500).optional(),
  linhas: z
    .array(
      z.object({
        produtoId: idSchema,
        quantidade: z.number().int().min(1).max(99),
        config: z.object({
          tamanhoId: idSchema.nullable(),
          selecoes: z.record(z.string(), z.array(idSchema).max(50)),
        }),
      }),
    )
    .min(1)
    .max(50),
});

export type CheckoutValidado = z.infer<typeof checkoutSchema>;
