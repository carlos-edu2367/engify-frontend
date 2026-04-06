import { api } from "@/lib/axios";
import type {
  MovimentacaoResponse,
  CreateMovimentacaoRequest,
  PagamentoResponse,
  CreatePagamentoRequest,
  UpdatePagamentoRequest,
  ListMovimentacoesParams,
  ListPagamentosParams,
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

  createPagamento: (data: CreatePagamentoRequest) =>
    api.post<PagamentoResponse>("/financeiro/pagamentos", data).then((r) => r.data),

  updatePagamento: (id: string, data: UpdatePagamentoRequest) =>
    api.put<PagamentoResponse>(`/financeiro/pagamentos/${id}`, data).then((r) => r.data),

  payPagamento: (id: string) =>
    api.patch<MovimentacaoResponse>(`/financeiro/pagamentos/${id}/pay`).then((r) => r.data),
};
