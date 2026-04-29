import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/utils";
import { rhService } from "@/services/rh.service";
import type {
  RhAtestadoFilters,
  RhTipoAtestadoCreateRequest,
  RhTipoAtestadoUpdateRequest,
} from "@/types/rh.types";
import { rhQueryKeys } from "../../shared/utils/queryKeys";

export function useAtestados(filters: RhAtestadoFilters) {
  return useQuery({
    queryKey: rhQueryKeys.atestados.list(filters),
    queryFn: () => rhService.listAtestados(filters),
    staleTime: 20_000,
  });
}

export function useTiposAtestado(page = 1, limit = 50) {
  return useQuery({
    queryKey: [...rhQueryKeys.all, "tipos-atestado", { page, limit }],
    queryFn: () => rhService.listTiposAtestado(page, limit),
    staleTime: 60_000,
  });
}

export function useAtestadoActions() {
  const queryClient = useQueryClient();

  const invalidateAtestados = () => {
    queryClient.invalidateQueries({ queryKey: [...rhQueryKeys.all, "atestados"] });
    queryClient.invalidateQueries({ queryKey: [...rhQueryKeys.all, "dashboard"] });
    queryClient.invalidateQueries({ queryKey: [...rhQueryKeys.all, "folha"] });
  };

  const invalidateTipos = () => {
    queryClient.invalidateQueries({ queryKey: [...rhQueryKeys.all, "tipos-atestado"] });
  };

  return {
    deliver: useMutation({
      mutationFn: ({ id, file_path }: { id: string; file_path: string }) => rhService.deliverAtestado(id, { file_path }),
      onSuccess: () => {
        invalidateAtestados();
        toast.success("Atestado marcado como entregue.");
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    }),
    reject: useMutation({
      mutationFn: ({ id, motivo }: { id: string; motivo: string }) => rhService.rejectAtestado(id, motivo),
      onSuccess: () => {
        invalidateAtestados();
        toast.success("Atestado rejeitado.");
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    }),
    createTipo: useMutation({
      mutationFn: (data: RhTipoAtestadoCreateRequest) => rhService.createTipoAtestado(data),
      onSuccess: () => {
        invalidateTipos();
        toast.success("Tipo de atestado criado.");
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    }),
    updateTipo: useMutation({
      mutationFn: ({ id, data }: { id: string; data: RhTipoAtestadoUpdateRequest }) => rhService.updateTipoAtestado(id, data),
      onSuccess: () => {
        invalidateTipos();
        toast.success("Tipo de atestado atualizado.");
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    }),
    deleteTipo: useMutation({
      mutationFn: (id: string) => rhService.deleteTipoAtestado(id),
      onSuccess: () => {
        invalidateTipos();
        toast.success("Tipo de atestado removido.");
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    }),
  };
}
