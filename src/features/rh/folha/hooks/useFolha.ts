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

export function useHoleriteItens(id?: string | null) {
  return useQuery({
    queryKey: rhQueryKeys.holerites.itens(id ?? null),
    queryFn: async () => {
      const response = await rhService.listHoleriteItens(id!);
      return Array.isArray(response) ? response : response.items;
    },
    enabled: !!id,
    staleTime: 30_000,
    retry: 1,
  });
}

export function useFolhaJobs() {
  return useQuery({
    queryKey: rhQueryKeys.folha.jobs({ page: 1, limit: 20 }),
    queryFn: () => rhService.listFolhaJobs(1, 20),
    refetchInterval: (query) => {
      const jobs = query.state.data?.items ?? [];
      const hasActiveJob = jobs.some((job) => ["queued", "running", "partial"].includes(job.status));
      return hasActiveJob ? 10_000 : false;
    },
    staleTime: 10_000,
    retry: 1,
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
    cancelJob: useMutation({
      mutationFn: (id: string) => rhService.cancelFolhaJob(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [...rhQueryKeys.all, "folha", "jobs"] });
        toast.success("Job de folha cancelado.");
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    }),
    retryJob: useMutation({
      mutationFn: (id: string) => rhService.retryFolhaJob(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [...rhQueryKeys.all, "folha", "jobs"] });
        toast.success("Retry solicitado.");
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    }),
  };
}
