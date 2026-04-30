import axios from "axios";
import { refreshAccessToken } from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";
import type { MeResponse } from "@/types/auth.types";

const BASE = import.meta.env.VITE_API_BASE_URL as string;

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
    const store = useAuthStore.getState();
    store.startBootstrap();

    try {
      const currentToken = useAuthStore.getState().accessToken;
      if (currentToken) {
        try {
          const me = await rawMe(currentToken);
          useAuthStore.getState().setAuth(currentToken, mapUser(me));
          return;
        } catch {
          // Token expirado ou invalido: continua para refresh via cookie HttpOnly.
        }
      }

      const newToken = await refreshAccessToken();
      const me = await rawMe(newToken);
      useAuthStore.getState().setAuth(newToken, mapUser(me));
    } catch {
      useAuthStore.getState().clearAuth();
    } finally {
      useAuthStore.getState().finishBootstrap();
      restoreSessionPromise = null;
    }
  })();

  return restoreSessionPromise;
}
