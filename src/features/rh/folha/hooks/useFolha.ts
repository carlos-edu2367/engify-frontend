import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/utils";
import { rhService } from "@/services/rh.service";
import type { RhFecharFolhaRequest, RhFolhaFilters, RhGerarFolhaRequest, RhHoleriteAjustesRequest } from "@/types/rh.types";
import { rhQueryKeys } from "../../shared/utils/queryKeys";

export function useFolha(filters: RhFolhaFilters) {
  return useQuery({
    queryKey: rhQueryKeys.folha.list(filters),
    queryFn: () => rhService.listFolha(filters),
    staleTime: 20_000,
  });
}

export function useHoleriteDetail(id?: string | null) {
  return useQuery({
    queryKey: rhQueryKeys.holerites.detail(id ?? null),
    queryFn: () => rhService.getHolerite(id!),
    enabled: !!id,
  });
}

export function useFolhaActions() {
  const queryClient = useQueryClient();

  const invalidateFolha = () => {
    queryClient.invalidateQueries({ queryKey: [...rhQueryKeys.all, "folha"] });
    queryClient.invalidateQueries({ queryKey: [...rhQueryKeys.all, "holerites"] });
    queryClient.invalidateQueries({ queryKey: [...rhQueryKeys.all, "dashboard"] });
  };

  return {
    generate: useMutation({
      mutationFn: (data: RhGerarFolhaRequest) => rhService.generateFolha(data),
      onSuccess: (items) => {
        invalidateFolha();
        toast.success(`${items.length} holerite(s) gerado(s) ou atualizado(s).`);
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    }),
    close: useMutation({
      mutationFn: (data: RhFecharFolhaRequest) => rhService.closeFolha(data),
      onSuccess: (items) => {
        invalidateFolha();
        toast.success(`${items.length} holerite(s) fechado(s).`);
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    }),
    updateAjustes: useMutation({
      mutationFn: ({ id, data }: { id: string; data: RhHoleriteAjustesRequest }) => rhService.updateHoleriteAjustes(id, data),
      onSuccess: () => {
        invalidateFolha();
        toast.success("Ajustes manuais salvos.");
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    }),
  };
}
