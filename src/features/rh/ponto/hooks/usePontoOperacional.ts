import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/utils";
import { rhService } from "@/services/rh.service";
import type { RhAjusteFilters, RhPontoFilters } from "@/types/rh.types";
import { rhQueryKeys } from "../../shared/utils/queryKeys";

export function usePontos(filters: RhPontoFilters) {
  return useQuery({
    queryKey: rhQueryKeys.ponto.list(filters),
    queryFn: () => rhService.listPontos(filters),
    staleTime: 20_000,
  });
}

export function useAjustesPonto(filters: RhAjusteFilters) {
  return useQuery({
    queryKey: rhQueryKeys.ajustes.list(filters),
    queryFn: () => rhService.listAjustes(filters),
    staleTime: 20_000,
  });
}

export function usePontoDiaDetalhe(funcionarioId?: string | null, data?: string | null) {
  return useQuery({
    queryKey: [...rhQueryKeys.all, "ponto", "dia", funcionarioId ?? null, data ?? null],
    queryFn: () => rhService.getPontoDiaDetalhe(funcionarioId!, data!),
    enabled: !!funcionarioId && !!data,
    retry: 1,
  });
}

export function useAjustePontoActions() {
  const queryClient = useQueryClient();

  const invalidateAjustes = () => {
    queryClient.invalidateQueries({ queryKey: [...rhQueryKeys.all, "ajustes"] });
    queryClient.invalidateQueries({ queryKey: [...rhQueryKeys.all, "ponto"] });
    queryClient.invalidateQueries({ queryKey: [...rhQueryKeys.all, "dashboard"] });
  };

  return {
    approve: useMutation({
      mutationFn: (id: string) => rhService.approveAjuste(id),
      onSuccess: () => {
        invalidateAjustes();
        toast.success("Ajuste aprovado.");
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    }),
    reject: useMutation({
      mutationFn: ({ id, motivo }: { id: string; motivo: string }) => rhService.rejectAjuste(id, motivo),
      onSuccess: () => {
        invalidateAjustes();
        toast.success("Ajuste rejeitado.");
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    }),
  };
}
