import { api } from "@/lib/axios";
import type { UserResponse, UpdateUserRequest } from "@/types/user.types";

export interface InviteFuncionarioResponse {
  id: string;
  email: string;
  role: string;
  message: string;
}

export const usersService = {
  getMe: () =>
    api.get<UserResponse>("/users/me").then((r) => r.data),

  updateMe: (data: UpdateUserRequest) =>
    api.put<UserResponse>("/users/me", data).then((r) => r.data),

  list: () =>
    api.get<UserResponse[]>("/users").then((r) => r.data),

  delete: (userId: string) =>
    api.delete<{ message: string }>(`/users/${userId}`).then((r) => r.data),

  inviteFuncionario: (email: string) =>
    api
      .post<InviteFuncionarioResponse>("/teams/me/invite", {
        email,
        role: "funcionario",
      })
      .then((r) => r.data),
};
