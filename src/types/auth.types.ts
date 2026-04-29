export type Role = "admin" | "engenheiro" | "financeiro" | "cliente" | "super_admin" | "funcionario";

export interface MeResponse {
  id: string;
  nome: string;
  email: string;
  role: Role;
  team_id: string;
}

export interface AuthUser {
  id: string;
  nome: string;
  email: string;
  role: Role;
  teamId: string;
}

export interface LoginRequest {
  email?: string;
  cpf?: string;
  senha: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  team_id: string;
  role: Role;
  nome: string;
}

export interface RegisterRequest {
  nome: string;
  senha: string;
  cpf: string;
  solicitacao_id: string;
}

export interface RegisterResponse {
  id: string;
  nome: string;
  email: string;
  role: Role;
  team_id: string;
}

export interface RecoveryRequest {
  email?: string;
  cpf?: string;
}

export interface RecoveryVerifyRequest {
  user_id: string;
  code: string;
}

export interface RecoveryResetRequest {
  user_id: string;
  code: string;
  new_password: string;
}
