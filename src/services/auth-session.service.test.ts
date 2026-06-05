import { beforeEach, describe, expect, it, vi } from "vitest";

const axiosGet = vi.hoisted(() => vi.fn());
const refreshAccessToken = vi.hoisted(() => vi.fn());

vi.mock("axios", () => ({
  default: {
    get: axiosGet,
    isAxiosError: vi.fn(() => false),
  },
}));

vi.mock("@/lib/axios", () => ({
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
    });
    expect(refreshAccessToken).not.toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });
});
