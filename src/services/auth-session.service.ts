import axios from "axios";
import { refreshAccessToken } from "@/lib/axios";
import { loadSessionAccessToken } from "@/services/auth-session-token";
import { useAuthStore } from "@/store/auth.store";
import type { MeResponse } from "@/types/auth.types";

const BASE = import.meta.env.VITE_API_BASE_URL as string;
const DEV = import.meta.env.DEV;

function devLog(msg: string, extra?: unknown) {
  if (DEV) {
    if (extra !== undefined) {
      console.log(`[Auth] ${msg}`, extra);
    } else {
      console.log(`[Auth] ${msg}`);
    }
  }
}

function mapUser(me: MeResponse) {
  return {
    id: me.id,
    nome: me.nome,
    email: me.email,
    role: me.role,
    teamId: me.team_id,
  };
}

async function rawMe(token: string): Promise<MeResponse> {
  const { data } = await axios.get<MeResponse>(`${BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}

let restoreSessionPromise: Promise<void> | null = null;

export function restoreSession() {
  if (restoreSessionPromise) {
    return restoreSessionPromise;
  }

  restoreSessionPromise = (async () => {
    devLog("bootstrap iniciado", { origin: window.location.origin });

    const store = useAuthStore.getState();
    store.startBootstrap();

    try {
      const currentToken = useAuthStore.getState().accessToken ?? loadSessionAccessToken();
      devLog("token em memória?", !!currentToken);

      if (currentToken) {
        try {
          const me = await rawMe(currentToken);
          devLog("/me com token existente: 200 ✓");
          useAuthStore.getState().setAuth(currentToken, mapUser(me));
          return;
        } catch {
          devLog("/me com token existente: falhou — tentando refresh via cookie");
        }
      }

      devLog("chamando /auth/refresh via cookie HttpOnly...");
      const newToken = await refreshAccessToken();
      devLog("refresh: novo token recebido ✓");

      const me = await rawMe(newToken);
      devLog("/me após refresh: 200 ✓");
      useAuthStore.getState().setAuth(newToken, mapUser(me));
    } catch (err: unknown) {
      const isAxiosErr = axios.isAxiosError(err);
      const status = isAxiosErr ? err.response?.status : undefined;
      const isNetworkError = isAxiosErr && !err.response;

      if (isNetworkError) {
        // Erro de rede (sem resposta): cookie pode estar ok, problema é conectividade.
        // Limpamos auth igualmente para não deixar estado inconsistente, mas logamos.
        devLog("bootstrap: erro de REDE (sem resposta do servidor) — clearAuth");
      } else {
        devLog("bootstrap: falha na restauração", { status });
      }

      useAuthStore.getState().clearAuth();
    } finally {
      useAuthStore.getState().finishBootstrap();
      restoreSessionPromise = null;
    }
  })();

  return restoreSessionPromise;
}
