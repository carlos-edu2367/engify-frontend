import { api } from "@/lib/axios";
import type {
  DiariesResponse,
  CreateDiariaRequest,
  UpdateDiariaRequest,
} from "@/types/diaria.types";
import type { PaginatedResponse } from "@/types/api.types";

export const diariasService = {
  list: (params: { start: string; end: string; page?: number; limit?: number }) =>
    api
      .get<PaginatedResponse<DiariesResponse>>("/diarias", { params })
      .then((r) => r.data),

  create: (data: CreateDiariaRequest) =>
    api.post<DiariesResponse>("/diarias", data).then((r) => r.data),

  update: (id: string, data: UpdateDiariaRequest) =>
    api.put<DiariesResponse>(`/diarias/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete<{ message: string }>(`/diarias/${id}`).then((r) => r.data),
};
