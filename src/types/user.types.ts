import type { Role } from "./auth.types";

export interface UserResponse {
  user_id: string;
  nome: string;
  email: string;
  role: Role;
  team_id?: string;
}

export interface UpdateUserRequest {
  nome?: string;
  email?: string;
}
