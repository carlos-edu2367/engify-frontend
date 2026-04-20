import { api } from "@/lib/axios";
import type {
  MuralPostResponse,
  CreateMuralPostRequest,
  CreateMuralAttachmentRequest,
  MuralAttachmentResponse,
} from "@/types/mural.types";
import type { PaginatedResponse } from "@/types/api.types";

export const muralService = {
  list: (obraId: string, params: { page?: number; limit?: number } = {}) =>
    api
      .get<PaginatedResponse<MuralPostResponse>>(`/obras/${obraId}/mural`, { params })
      .then((r) => r.data),

  listAttachments: (obraId: string) =>
    api
      .get<MuralAttachmentResponse[]>(`/obras/${obraId}/mural/attachments`)
      .then((r) => r.data),

  create: (obraId: string, data: CreateMuralPostRequest) =>
    api
      .post<MuralPostResponse>(`/obras/${obraId}/mural`, data)
      .then((r) => r.data),

  delete: (obraId: string, postId: string) =>
    api
      .delete<{ message: string }>(`/obras/${obraId}/mural/${postId}`)
      .then((r) => r.data),

  addAttachment: (obraId: string, postId: string, data: CreateMuralAttachmentRequest) =>
    api
      .post<MuralAttachmentResponse>(`/obras/${obraId}/mural/${postId}/attachments`, data)
      .then((r) => r.data),

  deleteAttachment: (obraId: string, postId: string, attachmentId: string) =>
    api
      .delete<{ message: string }>(
        `/obras/${obraId}/mural/${postId}/attachments/${attachmentId}`
      )
      .then((r) => r.data),
};
