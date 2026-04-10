import type { Role } from "./auth.types";

export type Plan = "trial" | "basico" | "pro" | "enterprise";

export interface TeamResponse {
  id: string;
  title: string;
  cnpj: string;
  plan: Plan;
  days_to_expire?: number;
}

export interface CreateTeamRequest {
  title: string;
  cnpj: string;
}

export interface CreateTeamResponse {
  id: string;
  title: string;
  cnpj: string;
  plan: Plan;
  key: string;
}

export interface CreateFirstUserRequest {
  nome: string;
  email: string;
  senha: string;
  cpf: string;
  cnpj: string;
  key: string;
}

export interface InviteRequest {
  email: string;
  role: Exclude<Role, "super_admin">;
}

export interface InviteResponse {
  id: string;
  email: string;
  role: Role;
  message: string;
}

export interface DiaristResponse {
  id: string;
  nome: string;
  descricao?: string;
  valor_diaria: string;
  chave_pix?: string;
}

export interface CreateDiaristRequest {
  nome: string;
  descricao?: string;
  valor_diaria: string;
  chave_pix?: string;
}
