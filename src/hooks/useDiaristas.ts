import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teamsService } from "@/services/teams.service";
import type { CreateDiaristRequest } from "@/types/team.types";

export function useDiaristas(page = 1, limit = 50) {
  return useQuery({
    queryKey: ["diaristas"],
    queryFn: () => teamsService.getDiaristas(page, limit),
  });
}

export function useCreateDiarista() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDiaristRequest) => teamsService.createDiarista(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["diaristas"] }),
  });
}

export function useUpdateDiarista() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateDiaristRequest> }) =>
      teamsService.updateDiarista(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["diaristas"] }),
  });
}

export function useDeleteDiarista() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => teamsService.deleteDiarista(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["diaristas"] }),
  });
}
