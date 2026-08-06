export type MovType = "entrada" | "saida";
export type MovClass =
  | "diarista"
  | "servico"
  | "contrato"
  | "material"
  | "fixo"
  | "operacional";
export type MovNatureza = "manual" | "open_finance";
export type PagamentoStatus = "aguardando" | "pago";

export type AttachmentKind = "documento" | "comprovante";

export interface MovimentacaoResponse {
  id: string;
  title: string;
  type: MovType;
  valor: string;
  classe: MovClass;
  natureza: MovNatureza;
  obra_id?: string;
  pagamento_id?: string;
  data_movimentacao: string;
}

export interface PayPagamentoResponse extends MovimentacaoResponse {
  pagamento_id: string;
  requires_receipt: boolean;
}

export interface CreateMovimentacaoRequest {
  title: string;
  type: MovType;
  valor: string;
  classe: MovClass;
  obra_id?: string;
}

export interface PagamentoResponse {
  id: string;
  title: string;
  details?: string;
  valor: string;
  classe: MovClass;
  status: PagamentoStatus;
  data_agendada?: string;
  payment_cod?: string;
  pix_copy_and_past?: string;
  obra_id?: string;
  diarist_id?: string;
  payment_date?: string;
  created_by_user_id?: string;
  created_by_role?: string;
  created_by_name?: string;
  created_by_engineer: boolean;
  created_at?: string;
  parcelamento_id?: string;
  parcela_numero?: number;
  parcela_total?: number;
  requires_receipt?: boolean;
  receipt_attached?: boolean;
}

export interface CreatePagamentoRequest {
  title: string;
  details?: string;
  valor: string;
  classe: MovClass;
  data_agendada?: string;
  payment_cod?: string;
  obra_id?: string;
  diarist_id?: string;
  requires_receipt?: boolean;
}

export interface CreatePagamentoParceladoRequest {
  title: string;
  details: string;
  valor: string;
  classe: MovClass;
  data_agendada: string;
  parcelas: number;
  payment_cods?: (string | null)[];
  obra_id?: string;
  diarist_id?: string;
  requires_receipt?: boolean;
}

export interface CreateObraPagamentoParceladoRequest {
  title: string;
  details: string;
  valor: string;
  data_agendada: string;
  parcelas: number;
  payment_cods: (string | null)[];
  requires_receipt?: boolean;
}

export interface UpdatePagamentoRequest {
  title?: string;
  details?: string;
  valor?: string;
  classe?: MovClass;
  data_agendada?: string;
  payment_cod?: string;
  obra_id?: string;
  requires_receipt?: boolean;
  apply_to?: "self" | "future";
}

export interface ListMovimentacoesParams {
  page?: number;
  limit?: number;
  period_start?: string;
  period_end?: string;
  obra_id?: string;
  classe?: MovClass | "all";
}

export interface ListPagamentosParams {
  page?: number;
  limit?: number;
  status?: PagamentoStatus | "all";
  obra_id?: string;
  scope?: "mine" | "all";
  /** Recorte por data de vencimento (data_agendada), em ISO8601. */
  period_start?: string;
  period_end?: string;
  comprovante_pendente?: boolean;
}

export interface CreateObraPagamentoRequest {
  title: string;
  details: string;
  valor: string;
  data_agendada: string;
  payment_cod: string;
  requires_receipt?: boolean;
}

export interface MovimentacaoAttachmentResponse {
  id: string;
  movimentacao_id: string;
  file_path: string;
  file_name: string;
  content_type: string;
  created_at: string;
  kind: AttachmentKind;
  origem_pagamento_id?: string;
}

export interface CreateMovimentacaoAttachmentRequest {
  file_path: string;
  file_name: string;
  content_type: string;
  kind?: AttachmentKind;
}

export interface PagamentoAttachmentResponse {
  id: string;
  pagamento_id: string;
  file_path: string;
  file_name: string;
  content_type: string;
  created_at: string;
}

export interface CreatePagamentoAttachmentRequest {
  file_path: string;
  file_name: string;
  content_type: string;
  replicate_parcelamento?: boolean;
}

export interface BaixaLoteRequest {
  pagamento_ids: string[];
}

export interface BaixaLoteResponse {
  quantidade: number;
  valor_total: number;
  movimentacao_id: string;
  comprovante_pendente_count: number;
}

export type CommissionReportJobStatus = "pending" | "processing" | "completed" | "failed";

export interface CreateCommissionReportRequest {
  categoria_id: string;
  mes: number;
  ano: number;
  porcentagem_comissao: string;
}

export interface CreateCommissionReportResponse {
  job_id: string;
}

export interface CommissionReportJobStatusResponse {
  status: CommissionReportJobStatus;
  file_url?: string | null;
  error_message?: string | null;
}

export interface ComprovacaoAttachmentResponse {
  id: string;
  file_path: string;
  file_name: string;
  content_type: string;
  kind: AttachmentKind;
  created_at: string;
}

export interface ComprovacaoMovimentacaoResponse {
  id: string;
  title: string;
  valor: string;
  data_movimentacao: string;
  is_lote: boolean;
}

export interface ComprovacaoResponse {
  movimentacao: ComprovacaoMovimentacaoResponse | null;
  attachments: ComprovacaoAttachmentResponse[];
}

export interface FluxoCaixaItemResponse {
  mes: string;
  total_entradas: number;
  total_saidas: number;
  saldo: number;
}

export interface FluxoCaixaResumoResponse {
  total_entradas: number;
  total_saidas: number;
  saldo_total: number;
}

export interface FluxoCaixaResponse {
  periodo: string;
  dados: FluxoCaixaItemResponse[];
  resumo: FluxoCaixaResumoResponse;
}
