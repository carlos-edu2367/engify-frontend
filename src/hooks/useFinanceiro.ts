import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { financeiroService } from "@/services/financeiro.service";
import type {
  CreateMovimentacaoRequest,
  CreatePagamentoRequest,
  UpdatePagamentoRequest,
} from "@/types/financeiro.types";

export function useMovimentacoes(params: { limit?: number } = {}) {
  return useQuery({
    queryKey: ["financeiro", "movimentacoes", params],
    queryFn: () => financeiroService.listMovimentacoes(params),
  });
}

export function useCreateMovimentacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMovimentacaoRequest) => financeiroService.createMovimentacao(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["financeiro"] }),
  });
}

export function usePagamentos(params: { limit?: number } = {}) {
  return useQuery({
    queryKey: ["financeiro", "pagamentos", params],
    queryFn: () => financeiroService.listPagamentos(params),
  });
}

export function useCreatePagamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePagamentoRequest) => financeiroService.createPagamento(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["financeiro"] }),
  });
}

export function useUpdatePagamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePagamentoRequest }) =>
      financeiroService.updatePagamento(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["financeiro"] }),
  });
}

export function usePayPagamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeiroService.payPagamento(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["financeiro"] }),
  });
}
