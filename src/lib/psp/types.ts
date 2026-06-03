import type { StatusPagamento } from "@prisma/client";

/**
 * Contrato provider-agnostic de PSP de PIX. Cada provedor (Asaas, Mercado Pago,
 * Efí, Inter) implementa esta interface; o resto do app só conhece estes tipos.
 */

/** Dados para criar uma cobrança PIX. */
export interface CriarCobrancaInput {
  /** Valor em reais (ex.: 25.90). */
  valor: number;
  /** Identificador interno (ex.: id ou número do pedido) p/ conciliação. */
  referenciaExterna: string;
  /** Descrição exibida ao pagador. */
  descricao?: string;
  /** Segundos até expirar; default vem de PIX_EXPIRACAO_SEGUNDOS. */
  expiraEmSegundos?: number;
  /** Dados do pagador (alguns PSPs exigem em produção). */
  pagador?: { nome?: string; cpfCnpj?: string; telefone?: string };
}

/** Cobrança PIX criada no PSP. */
export interface Cobranca {
  /** Id da cobrança no PSP (idempotência / consulta). */
  txid: string;
  status: StatusPagamento;
  valor: number;
  /** Payload copia-e-cola do PIX. */
  copiaCola: string;
  /** Imagem do QR Code (data URI base64 ou URL). */
  qrCode: string | null;
  expiraEm: Date | null;
}

/** Resultado de um webhook após validação + parse. */
export interface EventoWebhook {
  /** Cobrança referenciada pelo evento. */
  txid: string;
  status: StatusPagamento;
  /** Tipo bruto do evento no PSP (para log/auditoria). */
  tipoOriginal: string;
}

/** Interface que todo adapter de PSP deve implementar. */
export interface PspProvider {
  readonly nome: string;

  /** Cria uma cobrança PIX e retorna QR + copia-e-cola. */
  criarCobranca(input: CriarCobrancaInput): Promise<Cobranca>;

  /** Consulta o status atual de uma cobrança (usado no polling de backup). */
  consultarCobranca(txid: string): Promise<Cobranca>;

  /** Estorna (total) uma cobrança já confirmada. */
  estornar(txid: string): Promise<void>;

  /** Cancela uma cobrança ainda não paga (evita pagamento após cancelamento). */
  cancelarCobranca(txid: string): Promise<void>;

  /**
   * Valida a autenticidade do webhook e extrai o evento. Retorna null se a
   * assinatura/segredo for inválido (a rota responde 401 sem processar).
   */
  validarWebhook(req: Request, rawBody: string): Promise<EventoWebhook | null>;

  /** Confirma que as credenciais funcionam (validação de conectividade). */
  verificarConexao(): Promise<{ ok: boolean; detalhe: string }>;
}
