import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { obrasService } from "@/services/obras.service";
import { getNextPageParam } from "@/lib/pagination";
import type { ObraStatus, CreateObraRequest, UpdateObraRequest, RecebimentoRequest } from "@/types/obra.types";

export function useObrasList(params: { status?: ObraStatus | "all"; limit?: number } = {}) {
  return useQuery({
    queryKey: ["obras", params],
    queryFn: () => obrasService.list(params),
  });
}

export function useObrasInfinite(params: { status?: ObraStatus | "all"; search?: string; limit?: number } = {}) {
  const limit = params.limit ?? 50;
  return useInfiniteQuery({
    queryKey: ["obras", "infinite", { status: params.status, search: params.search, limit }],
    queryFn: ({ pageParam }) =>
      obrasService.list({ status: params.status, search: params.search, limit, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam,
  });
}

export function useObra(id: string | undefined) {
  return useQuery({
    queryKey: ["obras", id],
    queryFn: () => obrasService.get(id!),
    enabled: !!id,
  });
}

export function useCreateObra() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateObraRequest) => obrasService.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["obras"] }),
  });
}

export function useUpdateObra(id: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateObraRequest) => obrasService.update(id!, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(["obras", id], updated);
      queryClient.invalidateQueries({ queryKey: ["obras"] });
    },
  });
}

export function useUpdateObraStatus(id: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: ObraStatus) => obrasService.updateStatus(id!, { status }),
    onSuccess: (updated) => queryClient.setQueryData(["obras", id], updated),
  });
}

export function useDeleteObra() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => obrasService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["obras"] }),
  });
}

export function useRegistrarRecebimento(obraId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RecebimentoRequest) => obrasService.registrarRecebimento(obraId!, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(["obras", obraId], updated);
      queryClient.invalidateQueries({ queryKey: ["obras", obraId, "entradas"] });
      queryClient.invalidateQueries({ queryKey: ["financeiro"] });
    },
  });
}

export function useDeleteRecebimento(obraId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recebimentoId: string) => obrasService.deleteRecebimento(obraId!, recebimentoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obras"] });
      queryClient.invalidateQueries({ queryKey: ["obras", obraId] });
      queryClient.invalidateQueries({ queryKey: ["obras", obraId, "entradas"] });
      queryClient.invalidateQueries({ queryKey: ["financeiro"] });
    },
  });
}

export function useObraEntradas(obraId: string | undefined) {
  return useQuery({
    queryKey: ["obras", obraId, "entradas"],
    queryFn: () => obrasService.listEntradas(obraId!, { limit: 50 }),
    enabled: !!obraId,
    staleTime: 5 * 60 * 1000,
  });
}
