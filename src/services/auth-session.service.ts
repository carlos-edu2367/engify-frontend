import axios from "axios";
import { AUTH_REQUEST_TIMEOUT_MS, refreshAccessToken } from "@/lib/axios";
import { loadSessionAccessToken } from "@/services/auth-session-token";
import { useAuthStore } from "@/store/auth.store";
import type { MeResponse } from "@/types/auth.types";

const BASE = import.meta.env.VITE_API_BASE_URL as string;
const DEV = import.meta.env.DEV;

// Backoff das retentativas automáticas quando a falha é transitória (offline,
// timeout, 429, 5xx do edge/servidor). O usuário não deve precisar clicar em
// "Tentar novamente" — quem retenta é o app.
const TRANSIENT_RETRY_DELAYS_MS = [600, 1_800, 4_000];

type FailureKind = "unauthenticated" | "transient" | "unknown";

interface Failure {
  kind: FailureKind;
  status?: number;
}

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
    timeout: AUTH_REQUEST_TIMEOUT_MS,
  });
  return data;
}

/**
 * Separa "não tem sessão" de "não deu para falar com o servidor".
 * Sem essa distinção, um 401 legítimo (cookie ausente/expirado) vira uma tela de
 * erro de infraestrutura em vez de simplesmente levar o usuário ao login.
 */
function classifyFailure(err: unknown): Failure {
  if (!axios.isAxiosError(err)) {
    return { kind: "unknown" };
  }

  const status = err.response?.status;

  // Sem resposta: offline, DNS, CORS, timeout. Sempre vale retentar.
  if (status === undefined) {
    return { kind: "transient" };
  }

  if (status === 401 || status === 403) {
    return { kind: "unauthenticated", status };
  }

  if (status === 429 || status >= 500) {
    return { kind: "transient", status };
  }

  return { kind: "unknown", status };
}

function messageFor({ kind, status }: Failure): string {
  if (kind === "transient") {
    return status === undefined
      ? "A conexão está demorando. Verifique sua internet e tente novamente."
      : "O servidor não respondeu como esperado. Tente novamente em instantes.";
  }
  return "Não foi possível conectar ao servidor.";
}

function logFailure(err: unknown, failure: Failure, attempt: number) {
  const browserNavigator = typeof navigator !== "undefined" ? navigator : undefined;
  const connection = (
    browserNavigator as (Navigator & {
      connection?: { effectiveType?: string; downlink?: number; rtt?: number };
    }) | undefined
  )?.connection;

  console.warn("[Auth] falha ao restaurar sessão", {
    attempt,
    kind: failure.kind,
    status: failure.status,
    online: browserNavigator?.onLine,
    effectiveType: connection?.effectiveType,
    downlink: connection?.downlink,
    rtt: connection?.rtt,
    message: err instanceof Error ? err.message : String(err),
  });
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/**
 * Uma passada completa de restauração. Lança em caso de falha para que o
 * chamador decida entre retentar e desistir.
 */
async function attemptRestore(): Promise<void> {
  const currentToken = useAuthStore.getState().accessToken ?? loadSessionAccessToken();
  devLog("token em memória?", !!currentToken);

  if (currentToken) {
    try {
      const me = await rawMe(currentToken);
      devLog("/me com token existente: 200 ✓");
      useAuthStore.getState().setAuth(currentToken, mapUser(me));
      return;
    } catch (err) {
      // Só descemos para o refresh quando o token realmente não serve mais.
      // Se o /me caiu por rede/servidor, rotacionar o refresh token aqui
      // queimaria o cookie válido do usuário sem necessidade.
      if (classifyFailure(err).kind === "transient") {
        devLog("/me com token existente: falha transitória — não rotaciona o refresh");
        throw err;
      }
      devLog("/me com token existente: falhou — tentando refresh via cookie");
    }
  }

  devLog("chamando /auth/refresh via cookie HttpOnly...");
  const newToken = await refreshAccessToken();
  devLog("refresh: novo token recebido ✓");

  const me = await rawMe(newToken);
  devLog("/me após refresh: 200 ✓");
  useAuthStore.getState().setAuth(newToken, mapUser(me));
}

let restoreSessionPromise: Promise<void> | null = null;

export function restoreSession() {
  if (restoreSessionPromise) {
    return restoreSessionPromise;
  }

  restoreSessionPromise = (async () => {
    devLog("bootstrap iniciado", { origin: window.location.origin });

    useAuthStore.getState().startBootstrap();

    let failure: Failure = { kind: "unknown" };

    try {
      for (let attempt = 0; ; attempt++) {
        try {
          await attemptRestore();
          useAuthStore.getState().finishBootstrap();
          return;
        } catch (err) {
          failure = classifyFailure(err);
          logFailure(err, failure, attempt);

          const delay =
            failure.kind === "transient" ? TRANSIENT_RETRY_DELAYS_MS[attempt] : undefined;
          if (delay === undefined) {
            break;
          }

          // Jitter evita que várias abas retentem no mesmo instante.
          await sleep(delay + Math.random() * 250);
        }
      }

      if (failure.kind === "unauthenticated") {
        // Não existe sessão — isso não é falha de infraestrutura. Sem
        // bootstrapError as rotas mandam o usuário ao /login normalmente.
        devLog("bootstrap: sem sessão válida — seguindo para o login", { status: failure.status });
        useAuthStore.getState().clearAuth();
        useAuthStore.getState().finishBootstrap();
        return;
      }

      if (failure.kind === "unknown") {
        useAuthStore.getState().clearAuth();
      }
      // Em falha transitória preservamos o access token: a próxima tentativa
      // pode reaproveitá-lo sem gastar uma rotação do refresh.

      useAuthStore.getState().finishBootstrap(messageFor(failure));
    } finally {
      if (useAuthStore.getState().isBootstrapping) {
        useAuthStore.getState().finishBootstrap();
      }
      restoreSessionPromise = null;
    }
  })();

  return restoreSessionPromise;
}
