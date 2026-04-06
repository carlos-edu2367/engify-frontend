import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { obrasService } from "@/services/obras.service";
import type { ObraStatus, CreateObraRequest, UpdateObraRequest } from "@/types/obra.types";

export function useObrasList(params: { status?: ObraStatus | "all"; limit?: number } = {}) {
  return useQuery({
    queryKey: ["obras", params],
    queryFn: () => obrasService.list(params),
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
