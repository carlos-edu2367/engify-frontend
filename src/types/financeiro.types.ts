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
}

export interface UpdatePagamentoRequest {
  title?: string;
  details?: string;
  valor?: string;
  data_agendada?: string;
  payment_cod?: string;
  obra_id?: string;
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
}

export interface CreateObraPagamentoRequest {
  title: string;
  details: string;
  valor: string;
  data_agendada: string;
  payment_cod: string;
}

export interface MovimentacaoAttachmentResponse {
  id: string;
  movimentacao_id: string;
  file_path: string;
  file_name: string;
  content_type: string;
  created_at: string;
}

export interface CreateMovimentacaoAttachmentRequest {
  file_path: string;
  file_name: string;
  content_type: string;
}
