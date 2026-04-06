import { api } from "@/lib/axios";
import type { UserResponse, UpdateUserRequest } from "@/types/user.types";

export const usersService = {
  getMe: () =>
    api.get<UserResponse>("/users/me").then((r) => r.data),

  updateMe: (data: UpdateUserRequest) =>
    api.put<UserResponse>("/users/me", data).then((r) => r.data),

  list: () =>
    api.get<UserResponse[]>("/users").then((r) => r.data),

  delete: (userId: string) =>
    api.delete<{ message: string }>(`/users/${userId}`).then((r) => r.data),
};
