import { beforeEach, describe, expect, it, vi } from "vitest";

const axiosGet = vi.hoisted(() => vi.fn());
const refreshAccessToken = vi.hoisted(() => vi.fn());
const isAxiosError = vi.hoisted(() => vi.fn(() => false));

vi.mock("axios", () => ({
  default: {
    get: axiosGet,
    isAxiosError,
  },
}));

function axiosErrorWithStatus(status: number) {
  return Object.assign(new Error(`request failed with status ${status}`), {
    isAxiosError: true,
    response: { status },
  });
}

function axiosErrorWithoutResponse() {
  return Object.assign(new Error("Network Error"), { isAxiosError: true, response: undefined });
}

vi.mock("@/lib/axios", () => ({
  AUTH_REQUEST_TIMEOUT_MS: 12000,
  refreshAccessToken,
}));

function createStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };
}

function unsignedJwt(exp: number) {
  const payload = btoa(JSON.stringify({ exp }))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
  return `header.${payload}.signature`;
}

describe("restoreSession", () => {
  let local: Storage;
  let session: Storage;

  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("VITE_API_BASE_URL", "https://api.example.com/api/v1");
    local = createStorage();
    session = createStorage();
    vi.stubGlobal("localStorage", local);
    vi.stubGlobal("window", {
      location: { origin: "https://app.example.com" },
      sessionStorage: session,
    });
    axiosGet.mockReset();
    refreshAccessToken.mockReset();
    isAxiosError.mockReset();
    isAxiosError.mockImplementation(() => false);
  });

  it("validates a session access token before attempting refresh", async () => {
    const token = unsignedJwt(Math.floor(Date.now() / 1000) + 60);
    session.setItem("engify-auth:access-token", token);
    axiosGet.mockResolvedValueOnce({
      data: {
        id: "user-1",
        nome: "User",
        email: "user@example.com",
        role: "admin",
        team_id: "team-1",
      },
    });

    const { restoreSession } = await import("./auth-session.service");
    const { useAuthStore } = await import("@/store/auth.store");

    await restoreSession();

    expect(axiosGet).toHaveBeenCalledWith("https://api.example.com/api/v1/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 12000,
    });
    expect(refreshAccessToken).not.toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it("exposes a recoverable bootstrap error when session restoration fails", async () => {
    refreshAccessToken.mockRejectedValueOnce(new Error("network timeout"));

    const { restoreSession } = await import("./auth-session.service");
    const { useAuthStore } = await import("@/store/auth.store");

    await restoreSession();

    expect(useAuthStore.getState().hasBootstrapped).toBe(true);
    expect(useAuthStore.getState().bootstrapError).toBe(
      "Não foi possível conectar ao servidor."
    );
  });

  it("treats a 401 from /auth/refresh as 'no session' instead of a server error", async () => {
    isAxiosError.mockImplementation(() => true);
    refreshAccessToken.mockRejectedValue(axiosErrorWithStatus(401));

    const { restoreSession } = await import("./auth-session.service");
    const { useAuthStore } = await import("@/store/auth.store");

    await restoreSession();

    // Sem bootstrapError, ProtectedRoute redireciona para /login em vez de
    // mostrar "Não foi possível abrir o aplicativo".
    expect(useAuthStore.getState().bootstrapError).toBeNull();
    expect(useAuthStore.getState().hasBootstrapped).toBe(true);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
  });

  it("retries transient failures until the session is restored", async () => {
    isAxiosError.mockImplementation(() => true);
    refreshAccessToken
      .mockRejectedValueOnce(axiosErrorWithStatus(503))
      .mockRejectedValueOnce(axiosErrorWithoutResponse())
      .mockResolvedValueOnce("fresh-token");
    axiosGet.mockResolvedValueOnce({
      data: {
        id: "user-1",
        nome: "User",
        email: "user@example.com",
        role: "admin",
        team_id: "team-1",
      },
    });

    const { restoreSession } = await import("./auth-session.service");
    const { useAuthStore } = await import("@/store/auth.store");

    await restoreSession();

    expect(refreshAccessToken).toHaveBeenCalledTimes(3);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().bootstrapError).toBeNull();
  });

  it("surfaces a connectivity message after exhausting the transient retries", async () => {
    isAxiosError.mockImplementation(() => true);
    refreshAccessToken.mockRejectedValue(axiosErrorWithoutResponse());

    const { restoreSession } = await import("./auth-session.service");
    const { useAuthStore } = await import("@/store/auth.store");

    await restoreSession();

    expect(refreshAccessToken).toHaveBeenCalledTimes(4);
    expect(useAuthStore.getState().bootstrapError).toBe(
      "A conexão está demorando. Verifique sua internet e tente novamente."
    );
    // O backoff completo (600 + 1800 + 4000ms + jitter) estoura o timeout padrão.
  }, 15_000);

  it("does not burn a refresh rotation when /auth/me fails transiently", async () => {
    const token = unsignedJwt(Math.floor(Date.now() / 1000) + 60);
    session.setItem("engify-auth:access-token", token);
    isAxiosError.mockImplementation(() => true);
    axiosGet.mockRejectedValueOnce(axiosErrorWithStatus(502));
    axiosGet.mockResolvedValueOnce({
      data: {
        id: "user-1",
        nome: "User",
        email: "user@example.com",
        role: "admin",
        team_id: "team-1",
      },
    });

    const { restoreSession } = await import("./auth-session.service");
    const { useAuthStore } = await import("@/store/auth.store");

    await restoreSession();

    expect(refreshAccessToken).not.toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });
});
