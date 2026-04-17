import { api } from "@/lib/axios";
import type {
  NotificacaoResponse,
  NotificacoesListResponse,
  NotificacoesContagemResponse,
} from "@/types/notificacoes.types";

export const notificacoesService = {
  list: (params: { page?: number; limit?: number } = {}) =>
    api
      .get<NotificacoesListResponse>("/notificacoes", { params })
      .then((r) => r.data),

  contagem: () =>
    api
      .get<NotificacoesContagemResponse>("/notificacoes/contagem")
      .then((r) => r.data),

  marcarLida: (id: string) =>
    api
      .patch<NotificacaoResponse>(`/notificacoes/${id}/lida`)
      .then((r) => r.data),

  marcarTodasLidas: () =>
    api
      .patch<{ message: string }>("/notificacoes/marcar-todas-lidas")
      .then((r) => r.data),
};
