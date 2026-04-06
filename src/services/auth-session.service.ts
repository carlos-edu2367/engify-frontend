import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import type { MeResponse } from "@/types/auth.types";

function mapUser(me: MeResponse) {
  return {
    id: me.id,
    nome: me.nome,
    email: me.email,
    role: me.role,
    teamId: me.team_id,
  };
}

function getStatusCode(error: unknown): number | null {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "status" in error.response &&
    typeof (error.response as { status?: unknown }).status === "number"
  ) {
    return (error.response as { status: number }).status;
  }
  return null;
}

let restoreSessionPromise: Promise<void> | null = null;

export function restoreSession() {
  if (restoreSessionPromise) {
    return restoreSessionPromise;
  }

  restoreSessionPromise = (async () => {
    const store = useAuthStore.getState();
    store.startBootstrap();

    try {
      // Primeiro tenta validar o access_token persistido.
      const currentToken = useAuthStore.getState().accessToken;
      if (currentToken) {
        try {
          const me = await authService.me();
          useAuthStore.getState().setAuth(currentToken, mapUser(me));
          return;
        } catch (error) {
          if (getStatusCode(error) !== 401) {
            throw error;
          }
        }
      }

      // Sem token valido, tenta renovar usando refresh_token em cookie HttpOnly.
      const { access_token } = await authService.refresh();
      useAuthStore.getState().setAccessToken(access_token);
      const me = await authService.me();
      useAuthStore.getState().setAuth(access_token, mapUser(me));
    } catch {
      useAuthStore.getState().clearAuth();
    } finally {
      useAuthStore.getState().finishBootstrap();
      restoreSessionPromise = null;
    }
  })();

  return restoreSessionPromise;
}
