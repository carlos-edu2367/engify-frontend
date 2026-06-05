import { beforeEach, describe, expect, it, vi } from "vitest";

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

describe("auth store session token persistence", () => {
  let local: Storage;
  let session: Storage;

  beforeEach(() => {
    vi.resetModules();
    local = createStorage();
    session = createStorage();
    vi.stubGlobal("localStorage", local);
    vi.stubGlobal("window", { sessionStorage: session });
  });

  it("stores the access token in session storage when auth is set", async () => {
    const { useAuthStore } = await import("./auth.store");

    useAuthStore.getState().setAuth("access-token", {
      id: "user-1",
      nome: "User",
      email: "user@example.com",
      role: "admin",
      teamId: "team-1",
    });

    expect(session.getItem("engify-auth:access-token")).toBe("access-token");
  });

  it("clears the session access token when auth is cleared", async () => {
    const { useAuthStore } = await import("./auth.store");

    session.setItem("engify-auth:access-token", "access-token");
    useAuthStore.getState().clearAuth();

    expect(session.getItem("engify-auth:access-token")).toBeNull();
  });
});
