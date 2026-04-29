import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/utils";
import { rhService } from "@/services/rh.service";
import type { RhFeriasCreateRequest, RhFeriasFilters } from "@/types/rh.types";
import { rhQueryKeys } from "../../shared/utils/queryKeys";

export function useFerias(filters: RhFeriasFilters) {
  return useQuery({
    queryKey: rhQueryKeys.ferias.list(filters),
    queryFn: () => rhService.listFerias(filters),
    staleTime: 20_000,
  });
}

export function useFeriasActions() {
  const queryClient = useQueryClient();

  const invalidateFerias = () => {
    queryClient.invalidateQueries({ queryKey: [...rhQueryKeys.all, "ferias"] });
    queryClient.invalidateQueries({ queryKey: [...rhQueryKeys.all, "dashboard"] });
    queryClient.invalidateQueries({ queryKey: [...rhQueryKeys.all, "folha"] });
  };

  return {
    create: useMutation({
      mutationFn: (data: RhFeriasCreateRequest) => rhService.createFerias(data),
      onSuccess: () => {
        invalidateFerias();
        toast.success("Ferias registradas.");
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    }),
    approve: useMutation({
      mutationFn: (id: string) => rhService.approveFerias(id),
      onSuccess: () => {
        invalidateFerias();
        toast.success("Ferias aprovadas.");
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    }),
    reject: useMutation({
      mutationFn: ({ id, motivo }: { id: string; motivo: string }) => rhService.rejectFerias(id, motivo),
      onSuccess: () => {
        invalidateFerias();
        toast.success("Ferias rejeitadas.");
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    }),
    cancel: useMutation({
      mutationFn: ({ id, motivo }: { id: string; motivo: string }) => rhService.cancelFerias(id, motivo),
      onSuccess: () => {
        invalidateFerias();
        toast.success("Ferias canceladas.");
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    }),
  };
}
