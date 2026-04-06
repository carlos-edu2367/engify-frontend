import { api } from "@/lib/axios";
import type {
  TeamResponse,
  CreateTeamRequest,
  CreateTeamResponse,
  CreateFirstUserRequest,
  InviteRequest,
  InviteResponse,
  DiaristResponse,
  CreateDiaristRequest,
} from "@/types/team.types";
import type { PaginatedResponse } from "@/types/api.types";

export const teamsService = {
  create: (data: CreateTeamRequest) =>
    api.post<CreateTeamResponse>("/teams", data).then((r) => r.data),

  createFirstUser: (data: CreateFirstUserRequest) =>
    api.post<{ message: string; user_id: string }>("/teams/first-user", data).then((r) => r.data),

  getMe: () =>
    api.get<TeamResponse>("/teams/me").then((r) => r.data),

  updateMe: (data: { title: string }) =>
    api.put<TeamResponse>("/teams/me", data).then((r) => r.data),

  getExpiration: () =>
    api.get<{ days_to_expire: number }>("/teams/me/expiration").then((r) => r.data),

  invite: (data: InviteRequest) =>
    api.post<InviteResponse>("/teams/me/invite", data).then((r) => r.data),

  getDiaristas: (page = 1, limit = 50) =>
    api
      .get<PaginatedResponse<DiaristResponse>>("/teams/me/diaristas", {
        params: { page, limit },
      })
      .then((r) => r.data),

  createDiarista: (data: CreateDiaristRequest) =>
    api.post<DiaristResponse>("/teams/me/diaristas", data).then((r) => r.data),

  updateDiarista: (id: string, data: Partial<CreateDiaristRequest>) =>
    api.put<DiaristResponse>(`/teams/me/diaristas/${id}`, data).then((r) => r.data),

  deleteDiarista: (id: string) =>
    api.delete<{ message: string }>(`/teams/me/diaristas/${id}`).then((r) => r.data),
};
