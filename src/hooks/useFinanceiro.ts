import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { financeiroService } from "@/services/financeiro.service";
import type {
  CreateMovimentacaoRequest,
  CreatePagamentoRequest,
  UpdatePagamentoRequest,
  CreateMovimentacaoAttachmentRequest,
  BaixaLoteRequest,
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

export function useDeleteMovimentacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeiroService.deleteMovimentacao(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financeiro"] });
      queryClient.invalidateQueries({ queryKey: ["obras"] });
    },
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

export function useMovimentacaoAttachments(movId: string | null) {
  return useQuery({
    queryKey: ["financeiro", "movimentacoes", movId, "attachments"],
    queryFn: () => financeiroService.listAttachments(movId!),
    enabled: !!movId,
    staleTime: 60 * 1000,
  });
}

export function useCreateMovimentacaoAttachment(movId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMovimentacaoAttachmentRequest) =>
      financeiroService.createAttachment(movId, data),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["financeiro", "movimentacoes", movId, "attachments"],
      }),
  });
}

export function useDeleteMovimentacaoAttachment(movId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (attId: string) => financeiroService.deleteAttachment(movId, attId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["financeiro", "movimentacoes", movId, "attachments"],
      }),
  });
}

export function useBaixaLotePagamentos() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BaixaLoteRequest) => financeiroService.baixaLotePagamentos(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["financeiro"] }),
  });
}
