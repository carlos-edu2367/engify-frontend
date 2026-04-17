import axios from "axios";
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

// Usa raw axios para isolar o bootstrap completamente do interceptor —
// evita Authorization: Bearer null, loops e deadlocks.
async function rawMe(token: string): Promise<MeResponse> {
  const { data } = await axios.get<MeResponse>(`${BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}

async function rawRefresh(): Promise<string> {
  const { data } = await axios.post<{ access_token: string }>(
    `${BASE}/auth/refresh`,
    {},
    { withCredentials: true }
  );
  return data.access_token;
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
      // 1. Tenta validar o accessToken persistido (caso normal após Fix 1).
      const currentToken = useAuthStore.getState().accessToken;
      if (currentToken) {
        try {
          const me = await rawMe(currentToken);
          useAuthStore.getState().setAuth(currentToken, mapUser(me));
          return;
        } catch {
          // Token expirado ou inválido — continua para refresh.
        }
      }

      // 2. Sem token válido, tenta renovar via cookie HttpOnly.
      const newToken = await rawRefresh();
      useAuthStore.getState().setAccessToken(newToken);
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
