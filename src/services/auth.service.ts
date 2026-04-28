import axios from "axios";
import { api } from "@/lib/axios";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RecoveryRequest,
  RecoveryVerifyRequest,
  RecoveryResetRequest,
  MeResponse,
} from "@/types/auth.types";

const authApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL as string,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export const authService = {
  login: (data: LoginRequest) =>
    authApi.post<LoginResponse>("/auth/login", data).then((r) => r.data),

  register: (data: RegisterRequest) =>
    authApi.post<RegisterResponse>("/auth/register", data).then((r) => r.data),

  refresh: () =>
    authApi.post<{ access_token: string; token_type: string }>("/auth/refresh").then((r) => r.data),

  logout: () =>
    api.post<{ message: string }>("/auth/logout").then((r) => r.data),

  me: () =>
    api.get<MeResponse>("/auth/me").then((r) => r.data),

  recovery: (data: RecoveryRequest) =>
    api.post<{ message: string }>("/auth/recovery", data).then((r) => r.data),

  recoveryVerify: (data: RecoveryVerifyRequest) =>
    api.post<{ message: string }>("/auth/recovery/verify", data).then((r) => r.data),

  recoveryReset: (data: RecoveryResetRequest) =>
    api.post<{ message: string }>("/auth/recovery/reset", data).then((r) => r.data),
};
