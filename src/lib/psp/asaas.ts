import type { StatusPagamento } from "@prisma/client";
import { z } from "zod";
import { env, getPspConfig } from "@/lib/env";
import { secureEqual } from "@/lib/secure-compare";
import type {
  Cobranca,
  CriarCobrancaInput,
  EventoWebhook,
  PspProvider,
} from "./types";

// Valida só o necessário do body do webhook Asaas (id e status da cobrança).
const asaasWebhookSchema = z.object({
  event: z.string().optional(),
  payment: z.object({
    id: z.string().min(1),
    status: z.string().min(1),
  }),
});

/**
 * Adapter do Asaas (https://docs.asaas.com).
 * Auth: header `access_token`. Fluxo PIX: cria customer → cria payment
 * (billingType PIX) → busca o QR Code. Webhook validado pelo header
 * `asaas-access-token` (igual ao PSP_WEBHOOK_SECRET configurado no painel).
 */

/** Mapeia o status do pagamento no Asaas para o nosso enum. */
function mapStatus(asaas: string): StatusPagamento {
  switch (asaas) {
    case "RECEIVED":
    case "CONFIRMED":
    case "RECEIVED_IN_CASH":
      return "CONFIRMADO";
    case "OVERDUE":
      return "EXPIRADO";
    case "REFUNDED":
    case "REFUND_REQUESTED":
    case "REFUND_IN_PROGRESS":
      return "ESTORNADO";
    case "DELETED":
      return "CANCELADO";
    case "PENDING":
    case "AWAITING_RISK_ANALYSIS":
      return "AGUARDANDO";
    default:
      return "AGUARDANDO";
  }
}

interface AsaasPayment {
  id: string;
  status: string;
  value: number;
}

interface AsaasPixQr {
  encodedImage?: string;
  payload?: string;
  expirationDate?: string;
}

class AsaasProvider implements PspProvider {
  readonly nome = "asaas";

  private async request<T>(
    path: string,
    init?: RequestInit & { json?: unknown },
  ): Promise<T> {
    const { baseUrl, apiKey } = getPspConfig();
    const { json, ...rest } = init ?? {};

    const res = await fetch(`${baseUrl}${path}`, {
      ...rest,
      headers: {
        access_token: apiKey,
        "Content-Type": "application/json",
        "User-Agent": "sorveteria-pedidos",
        ...(rest.headers ?? {}),
      },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`Asaas ${path} → HTTP ${res.status}: ${text}`);
    }
    return (text ? JSON.parse(text) : {}) as T;
  }

  async criarCobranca(input: CriarCobrancaInput): Promise<Cobranca> {
    // 1) Customer (Asaas exige um cliente vinculado ao pagamento).
    // mobilePhone é omitido de propósito: é opcional p/ PIX e o Asaas valida o
    // formato com rigor (rejeita números de teste). O telefone do cliente é
    // nosso identificador interno; o PSP não precisa dele.
    //
    // CPF/CNPJ: o cliente NÃO digita (UX estilo iFood). Usa o documento da loja
    // (PSP_CPF_CNPJ) como fallback — o Asaas só precisa dele para emitir a
    // cobrança; quem se identifica de fato é o pagador no app do banco.
    const cpfCnpj = input.pagador?.cpfCnpj || env.pspCpfCnpj;
    if (!cpfCnpj) {
      throw new Error(
        "PSP_CPF_CNPJ não configurado: necessário para gerar a cobrança PIX no Asaas.",
      );
    }
    const customer = await this.request<{ id: string }>("/customers", {
      method: "POST",
      json: {
        name: input.pagador?.nome ?? "Cliente sorveteria",
        cpfCnpj,
      },
    });

    // 2) Payment PIX. dueDate = hoje (a expiração do QR vem no passo 3).
    const hoje = new Date().toISOString().slice(0, 10);
    const payment = await this.request<AsaasPayment>("/payments", {
      method: "POST",
      json: {
        customer: customer.id,
        billingType: "PIX",
        value: input.valor,
        dueDate: hoje,
        description: input.descricao,
        externalReference: input.referenciaExterna,
      },
    });

    // 3) QR Code copia-e-cola + imagem.
    const qr = await this.request<AsaasPixQr>(
      `/payments/${payment.id}/pixQrCode`,
    );

    // O Asaas em sandbox (ou por padrão) pode retornar expirationDate de 1 ano no futuro.
    // Garantimos que expiraEm respeite o tempo configurado pela loja (PIX_EXPIRACAO_SEGUNDOS, ex: 5 min).
    const limiteExpiracao = new Date(Date.now() + env.pixExpiracaoSegundos * 1000);
    let expiraEm = qr.expirationDate ? new Date(qr.expirationDate) : limiteExpiracao;

    if (isNaN(expiraEm.getTime()) || expiraEm.getTime() > limiteExpiracao.getTime()) {
      expiraEm = limiteExpiracao;
    }

    return {
      txid: payment.id,
      status: mapStatus(payment.status),
      valor: payment.value,
      copiaCola: qr.payload ?? "",
      qrCode: qr.encodedImage ? `data:image/png;base64,${qr.encodedImage}` : null,
      expiraEm,
    };
  }

  async consultarCobranca(txid: string): Promise<Cobranca> {
    const payment = await this.request<AsaasPayment>(`/payments/${txid}`);
    return {
      txid: payment.id,
      status: mapStatus(payment.status),
      valor: payment.value,
      copiaCola: "",
      qrCode: null,
      expiraEm: null,
    };
  }

  async estornar(txid: string): Promise<void> {
    // Estorno total (sem `value` = devolve o valor cheio).
    await this.request(`/payments/${txid}/refund`, { method: "POST", json: {} });
  }

  async cancelarCobranca(txid: string): Promise<void> {
    await this.request(`/payments/${txid}`, { method: "DELETE" });
  }

  async validarWebhook(
    req: Request,
    rawBody: string,
  ): Promise<EventoWebhook | null> {
    const secret = env.pspWebhookSecret;
    const recebido = req.headers.get("asaas-access-token");

    // Sem segredo configurado ou divergente → rejeita (rota responde 401).
    // Comparação em tempo constante (evita timing attack no segredo).
    if (!secureEqual(recebido ?? "", secret)) return null;

    let bruto: unknown;
    try {
      bruto = JSON.parse(rawBody);
    } catch {
      return null;
    }

    const parsed = asaasWebhookSchema.safeParse(bruto);
    if (!parsed.success) return null;
    const { event, payment } = parsed.data;

    return {
      txid: payment.id,
      status: mapStatus(payment.status),
      tipoOriginal: event ?? "DESCONHECIDO",
    };
  }

  async verificarConexao(): Promise<{ ok: boolean; detalhe: string }> {
    try {
      await this.request("/customers?limit=1");
      const { baseUrl } = getPspConfig();
      return { ok: true, detalhe: `Asaas acessível em ${baseUrl}` };
    } catch (err) {
      return { ok: false, detalhe: (err as Error).message };
    }
  }
}

export const asaasProvider = new AsaasProvider();
