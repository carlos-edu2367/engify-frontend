import { api } from "@/lib/axios";
import type {
  ArkyChatRequest,
  ArkyChatResponse,
  ArkyConfirmResponse,
} from "./arky.types";

export const arkyService = {
  chat: (data: ArkyChatRequest) =>
    api
      .post<ArkyChatResponse>("/arky/chat", data)
      .then((r) => r.data),

  confirm: (previewId: string) =>
    api
      .post<ArkyConfirmResponse>(`/arky/confirm/${previewId}`)
      .then((r) => r.data),

  reject: (previewId: string) =>
    api
      .post<ArkyConfirmResponse>(`/arky/reject/${previewId}`)
      .then((r) => r.data),
};
