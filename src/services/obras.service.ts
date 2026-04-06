import { api } from "@/lib/axios";
import type {
  ObraResponse,
  ObraClienteResponse,
  CreateObraRequest,
  UpdateObraRequest,
  UpdateObraStatusRequest,
  ObraStatus,
} from "@/types/obra.types";
import type { PaginatedResponse } from "@/types/api.types";

export const obrasService = {
  list: (params: { page?: number; limit?: number; status?: ObraStatus | "all" } = {}) => {
    const queryParams = { ...params };
    if (queryParams.status === "all") {
      delete queryParams.status;
    }
    return api
      .get<PaginatedResponse<ObraResponse>>("/obras", { params: queryParams })
      .then((r) => r.data);
  },

  get: (id: string) =>
    api.get<ObraResponse>(`/obras/${id}`).then((r) => r.data),

  create: (data: CreateObraRequest) =>
    api.post<ObraResponse>("/obras", data).then((r) => r.data),

  update: (id: string, data: UpdateObraRequest) =>
    api.put<ObraResponse>(`/obras/${id}`, data).then((r) => r.data),

  updateStatus: (id: string, data: UpdateObraStatusRequest) =>
    api.patch<ObraResponse>(`/obras/${id}/status`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete<{ message: string }>(`/obras/${id}`).then((r) => r.data),

  getClienteView: (id: string) =>
    api.get<ObraClienteResponse>(`/obras/${id}/cliente`).then((r) => r.data),
};
