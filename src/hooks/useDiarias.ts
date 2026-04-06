import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { diariasService } from "@/services/diarias.service";
import type { CreateDiariaRequest, UpdateDiariaRequest } from "@/types/diaria.types";

export function useDiarias(params: { start: string; end: string; limit?: number }) {
  return useQuery({
    queryKey: ["diarias", { start: params.start, end: params.end }],
    queryFn: () => diariasService.list(params),
  });
}

export function useCreateDiaria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDiariaRequest) => diariasService.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["diarias"] }),
  });
}

export function useUpdateDiaria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDiariaRequest }) =>
      diariasService.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["diarias"] }),
  });
}

export function useDeleteDiaria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => diariasService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["diarias"] }),
  });
}
