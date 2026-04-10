import { api } from "@/lib/axios";
import type {
  CategoriaObraResponse,
  CategoriaObraListItem,
  CreateCategoriaObraRequest,
  UpdateCategoriaObraRequest,
} from "@/types/categoria-obra.types";
import type { ObraResponse } from "@/types/obra.types";
import type { PaginatedResponse } from "@/types/api.types";

export const categoriasObrasService = {
  list: (params: { page?: number; limit?: number } = {}) =>
    api
      .get<PaginatedResponse<CategoriaObraListItem>>("/categorias-obra", { params })
      .then((r) => r.data),

  get: (id: string) =>
    api.get<CategoriaObraResponse>(`/categorias-obra/${id}`).then((r) => r.data),

  create: (data: CreateCategoriaObraRequest) =>
    api.post<CategoriaObraResponse>("/categorias-obra", data).then((r) => r.data),

  update: (id: string, data: UpdateCategoriaObraRequest) =>
    api.patch<CategoriaObraResponse>(`/categorias-obra/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete<{ message: string }>(`/categorias-obra/${id}`).then((r) => r.data),

  listObras: (categoriaId: string, params: { page?: number; limit?: number } = {}) =>
    api
      .get<PaginatedResponse<ObraResponse>>(`/categorias-obra/${categoriaId}/obras`, { params })
      .then((r) => r.data),
};
