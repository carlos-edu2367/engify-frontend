import { api } from "@/lib/axios";
import type {
  ItemResponse,
  CreateItemRequest,
  UpdateItemRequest,
} from "@/types/item.types";
import type { ItemAttachmentResponse, CreateAttachmentRequest } from "@/types/attachment.types";

export const itemsService = {
  list: (obraId: string) =>
    api.get<ItemResponse[]>(`/obras/${obraId}/items`).then((r) => r.data),

  create: (obraId: string, data: CreateItemRequest) =>
    api.post<ItemResponse>(`/obras/${obraId}/items`, data).then((r) => r.data),

  update: (obraId: string, itemId: string, data: UpdateItemRequest) =>
    api.put<ItemResponse>(`/obras/${obraId}/items/${itemId}`, data).then((r) => r.data),

  delete: (obraId: string, itemId: string) =>
    api.delete<{ message: string }>(`/obras/${obraId}/items/${itemId}`).then((r) => r.data),

  listAttachments: (obraId: string, itemId: string) =>
    api
      .get<ItemAttachmentResponse[]>(`/obras/${obraId}/items/${itemId}/attachments`)
      .then((r) => r.data),

  addAttachment: (obraId: string, itemId: string, data: CreateAttachmentRequest) =>
    api
      .post<ItemAttachmentResponse>(`/obras/${obraId}/items/${itemId}/attachments`, data)
      .then((r) => r.data),

  deleteAttachment: (obraId: string, itemId: string, attachmentId: string) =>
    api
      .delete<{ message: string }>(
        `/obras/${obraId}/items/${itemId}/attachments/${attachmentId}`
      )
      .then((r) => r.data),
};

