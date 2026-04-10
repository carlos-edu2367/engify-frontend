import { api } from "@/lib/axios";
import type {
  MovimentacaoResponse,
  CreateMovimentacaoRequest,
  PagamentoResponse,
  CreatePagamentoRequest,
  UpdatePagamentoRequest,
  ListMovimentacoesParams,
  ListPagamentosParams,
  MovimentacaoAttachmentResponse,
  CreateMovimentacaoAttachmentRequest,
} from "@/types/financeiro.types";
import type { PaginatedResponse } from "@/types/api.types";

export const financeiroService = {
  listMovimentacoes: (params: ListMovimentacoesParams = {}) => {
    // Remove "all" values and empty strings before sending
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== "all" && v !== "")
    );
    return api
      .get<PaginatedResponse<MovimentacaoResponse>>("/financeiro/movimentacoes", { params: cleanParams })
      .then((r) => r.data);
  },

  createMovimentacao: (data: CreateMovimentacaoRequest) =>
    api.post<MovimentacaoResponse>("/financeiro/movimentacoes", data).then((r) => r.data),

  listPagamentos: (params: ListPagamentosParams = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== "all" && v !== "")
    );
    return api
      .get<PaginatedResponse<PagamentoResponse>>("/financeiro/pagamentos", { params: cleanParams })
      .then((r) => r.data);
  },

  getPagamento: (id: string) =>
    api.get<PagamentoResponse>(`/financeiro/pagamentos/${id}`).then((r) => r.data),

  createPagamento: (data: CreatePagamentoRequest) =>
    api.post<PagamentoResponse>("/financeiro/pagamentos", data).then((r) => r.data),

  updatePagamento: (id: string, data: UpdatePagamentoRequest) =>
    api.put<PagamentoResponse>(`/financeiro/pagamentos/${id}`, data).then((r) => r.data),

  payPagamento: (id: string) =>
    api.patch<MovimentacaoResponse>(`/financeiro/pagamentos/${id}/pay`).then((r) => r.data),

  listAttachments: (movId: string) =>
    api
      .get<MovimentacaoAttachmentResponse[]>(`/financeiro/movimentacoes/${movId}/attachments`)
      .then((r) => r.data),

  createAttachment: (movId: string, data: CreateMovimentacaoAttachmentRequest) =>
    api
      .post<MovimentacaoAttachmentResponse>(`/financeiro/movimentacoes/${movId}/attachments`, data)
      .then((r) => r.data),

  deleteAttachment: (movId: string, attId: string) =>
    api.delete(`/financeiro/movimentacoes/${movId}/attachments/${attId}`).then((r) => r.data),
};
