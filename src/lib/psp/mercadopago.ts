import { MercadoPagoConfig, Payment, PaymentRefund } from "mercadopago";
import { createHmac, timingSafeEqual } from "crypto";
import type { StatusPagamento } from "@prisma/client";
import { z } from "zod";
import { env } from "@/lib/env";
import type {
  Cobranca,
  CriarCobrancaInput,
  EventoWebhook,
  PspProvider,
} from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers internos
// ─────────────────────────────────────────────────────────────────────────────

/** Mapeia o status do Mercado Pago para o nosso enum interno. */
function mapStatus(
  status: string,
  statusDetail?: string,
): StatusPagamento {
  switch (status) {
    case "approved":
      return "CONFIRMADO";
    case "pending":
    case "in_process":
    case "authorized":
      return "AGUARDANDO";
    case "refunded":
    case "charged_back":
      return "ESTORNADO";
    case "cancelled":
    case "rejected":
      return "CANCELADO";
    default:
      // Expirado é um detalhe de status no MP, não um status de topo
      if (statusDetail === "expired") return "EXPIRADO";
      return "AGUARDANDO";
  }
}

/**
 * Validação do schema de webhook do Mercado Pago.
 * O MP envia { action, api_version, data: { id }, ... } para eventos de payment.
 */
const mpWebhookSchema = z.object({
  action: z.string().optional(),
  api_version: z.string().optional(),
  data: z.object({ id: z.union([z.string(), z.number()]) }),
  type: z.string().optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Adapter
// ─────────────────────────────────────────────────────────────────────────────

class MercadoPagoProvider implements PspProvider {
  readonly nome = "mercadopago";

  /** Cria e retorna um cliente MP autenticado com o ACCESS_TOKEN configurado. */
  private getClient(): MercadoPagoConfig {
    return new MercadoPagoConfig({
      accessToken: env.pspApiKey,
      options: { timeout: 10_000 },
    });
  }

  async criarCobranca(input: CriarCobrancaInput): Promise<Cobranca> {
    const client = this.getClient();
    const paymentClient = new Payment(client);

    const expiraEm = new Date(
      Date.now() + (input.expiraEmSegundos ?? env.pixExpiracaoSegundos) * 1000,
    );

    // Formata a data de expiração no formato ISO sem milissegundos (MP exige)
    const dateOfExpiration = expiraEm.toISOString().replace(/\.\d{3}Z$/, "-03:00");

    const response = await paymentClient.create({
      body: {
        transaction_amount: input.valor,
        description: input.descricao ?? "Pedido sorveteria",
        payment_method_id: "pix",
        date_of_expiration: dateOfExpiration,
        external_reference: input.referenciaExterna,
        payer: {
          email:
            // MP exige um e-mail; usamos um placeholder quando não há CPF/e-mail
            `pedido-${input.referenciaExterna}@devora.app`,
          first_name: input.pagador?.nome ?? "Cliente",
          identification:
            input.pagador?.cpfCnpj
              ? {
                  type: "CPF",
                  number: input.pagador.cpfCnpj.replace(/\D/g, ""),
                }
              : undefined,
        },
        notification_url: `${env.appUrl}/api/webhooks/psp`,
      },
    });

    if (!response.id) {
      throw new Error("Mercado Pago: resposta sem ID de pagamento.");
    }

    const txData = response.point_of_interaction?.transaction_data;
    const qrCodeBase64 = txData?.qr_code_base64 ?? null;
    const copiaCola = txData?.qr_code ?? "";

    return {
      txid: String(response.id),
      status: mapStatus(response.status ?? "pending", response.status_detail ?? undefined),
      valor: response.transaction_amount ?? input.valor,
      copiaCola,
      qrCode: qrCodeBase64 ? `data:image/png;base64,${qrCodeBase64}` : null,
      expiraEm,
    };
  }

  async consultarCobranca(txid: string): Promise<Cobranca> {
    const client = this.getClient();
    const paymentClient = new Payment(client);

    const response = await paymentClient.get({ id: Number(txid) });

    return {
      txid: String(response.id),
      status: mapStatus(response.status ?? "pending", response.status_detail ?? undefined),
      valor: response.transaction_amount ?? 0,
      copiaCola: "",
      qrCode: null,
      expiraEm: response.date_of_expiration
        ? new Date(response.date_of_expiration)
        : null,
    };
  }

  async estornar(txid: string): Promise<void> {
    const client = this.getClient();
    const refundClient = new PaymentRefund(client);

    // Estorno total: `create` sem `amount` no body devolve o valor cheio
    await refundClient.create({ payment_id: Number(txid), body: {} });
  }

  async cancelarCobranca(txid: string): Promise<void> {
    const client = this.getClient();
    const paymentClient = new Payment(client);

    await paymentClient.cancel({ id: Number(txid) });
  }

  async validarWebhook(
    req: Request,
    rawBody: string,
  ): Promise<EventoWebhook | null> {
    const secret = env.pspWebhookSecret;

    // ── Validação de assinatura HMAC-SHA256 (obrigatória em produção) ──
    // O MP envia dois headers:
    //   x-signature: ts=<timestamp>,v1=<hmac>
    //   x-request-id: <uuid> (opcional, para idempotência)
    //
    // A mensagem assinada é: "id:<data.id>;request-date:<ts>;"
    const xSignature = req.headers.get("x-signature");

    if (secret && xSignature) {
      // Extrai ts e v1 do header x-signature
      const parts = Object.fromEntries(
        xSignature.split(",").map((p) => {
          const [key, val] = p.split("=");
          return [key.trim(), val?.trim() ?? ""];
        }),
      );
      const ts = parts["ts"] ?? "";
      const v1 = parts["v1"] ?? "";

      // Parseia o body para extrair o data.id antes de validar
      let dataId = "";
      try {
        const parsed = JSON.parse(rawBody) as { data?: { id?: unknown } };
        dataId = String(parsed?.data?.id ?? "");
      } catch {
        return null;
      }

      // Manifesto: "id:<data.id>;request-date:<ts>;"
      const manifest = `id:${dataId};request-date:${ts};`;
      const hmac = createHmac("sha256", secret)
        .update(manifest)
        .digest("hex");

      const expected = Buffer.from(hmac);
      const received = Buffer.from(v1);

      if (
        expected.length !== received.length ||
        !timingSafeEqual(expected, received)
      ) {
        return null;
      }
    } else if (secret && !xSignature) {
      // Segredo configurado mas assinatura ausente → rejeita (não é do MP)
      return null;
    }
    // Se secret não está configurado (ex.: dev local sem ngrok), aceita sem validar.

    // ── Parse do body ──
    let bruto: unknown;
    try {
      bruto = JSON.parse(rawBody);
    } catch {
      return null;
    }

    const parsed = mpWebhookSchema.safeParse(bruto);
    if (!parsed.success) return null;

    const { action, type, data } = parsed.data;

    // Ignora notificações que não sejam de pagamento
    if (type && type !== "payment") return null;

    const paymentId = String(data.id);

    // Consulta o status real do pagamento (o webhook MP só envia o ID)
    let cobranca: Cobranca;
    try {
      cobranca = await this.consultarCobranca(paymentId);
    } catch {
      // Se falhar a consulta, não podemos conciliar — retorna null
      return null;
    }

    return {
      txid: cobranca.txid,
      status: cobranca.status,
      tipoOriginal: action ?? type ?? "payment",
    };
  }

  async verificarConexao(): Promise<{ ok: boolean; detalhe: string }> {
    try {
      // Usa o endpoint de busca de pagamentos sem filtro para confirmar autenticação.
      // Não cria nenhum recurso.
      const client = this.getClient();
      const paymentClient = new Payment(client);
      await paymentClient.search({ options: { limit: 1 } });
      return {
        ok: true,
        detalhe: "Mercado Pago: autenticação confirmada (ACCESS_TOKEN válido).",
      };
    } catch (err) {
      return { ok: false, detalhe: (err as Error).message };
    }
  }
}

export const mercadoPagoProvider = new MercadoPagoProvider();
