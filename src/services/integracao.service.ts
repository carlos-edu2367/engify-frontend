import { api } from "@/lib/axios";

export interface AuthorizeArcaikaRequest {
  client_id: string;
  redirect_uri: string;
  scope: string;
  code_challenge: string;
  code_challenge_method: string;
  state?: string | null;
  arcaika_organizacao_id: string;
  default_responsavel_id: string;
  default_categoria_id?: string | null;
}

export interface AuthorizeArcaikaResponse {
  redirect_to: string;
}

export const integracaoService = {
  /** Consentimento do admin: vincula o time a uma organização Arcaika (OAuth). */
  authorizeArcaika: (data: AuthorizeArcaikaRequest) =>
    api
      .post<AuthorizeArcaikaResponse>("/oauth/authorize", data)
      .then((r) => r.data),
};
