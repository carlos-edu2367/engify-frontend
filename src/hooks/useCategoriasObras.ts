import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoriasObrasService } from "@/services/categorias-obras.service";
import type {
  CreateCategoriaObraRequest,
  UpdateCategoriaObraRequest,
} from "@/types/categoria-obra.types";

export function useCategoriasObrasList(params: { page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: ["categorias-obras", params],
    queryFn: () => categoriasObrasService.list(params),
    staleTime: 60_000,
  });
}

// Carrega todas sem paginação — para uso em selects
export function useAllCategoriasObras() {
  return useQuery({
    queryKey: ["categorias-obras", { limit: 200 }],
    queryFn: () => categoriasObrasService.list({ limit: 200 }),
    staleTime: 60_000,
  });
}

export function useCategoriaObra(id: string | undefined) {
  return useQuery({
    queryKey: ["categorias-obras", id],
    queryFn: () => categoriasObrasService.get(id!),
    enabled: !!id,
  });
}

export function useCreateCategoriaObra() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoriaObraRequest) => categoriasObrasService.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categorias-obras"] }),
  });
}

export function useUpdateCategoriaObra(id: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateCategoriaObraRequest) =>
      categoriasObrasService.update(id!, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categorias-obras"] }),
  });
}

export function useDeleteCategoriaObra() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoriasObrasService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias-obras"] });
      queryClient.invalidateQueries({ queryKey: ["obras"] });
    },
  });
}

export function useObrasByCategoria(
  categoriaId: string | null,
  params: { page?: number; limit?: number } = {}
) {
  return useQuery({
    queryKey: ["obras", "by-categoria", categoriaId, params],
    queryFn: () => categoriasObrasService.listObras(categoriaId!, params),
    enabled: !!categoriaId,
  });
}
