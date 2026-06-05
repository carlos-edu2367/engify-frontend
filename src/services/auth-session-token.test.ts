import { describe, expect, it } from "vitest";
import {
  clearSessionAccessToken,
  loadSessionAccessToken,
  saveSessionAccessToken,
} from "./auth-session-token";

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

describe("auth session access token storage", () => {
  it("loads a valid access token saved in session storage", () => {
    const storage = createStorage();
    const token = unsignedJwt(Math.floor(Date.now() / 1000) + 60);

    saveSessionAccessToken(token, storage);

    expect(loadSessionAccessToken(storage)).toBe(token);
  });

  it("clears expired tokens instead of restoring them", () => {
    const storage = createStorage();
    const token = unsignedJwt(Math.floor(Date.now() / 1000) - 60);

    saveSessionAccessToken(token, storage);

    expect(loadSessionAccessToken(storage)).toBeNull();
    expect(storage.length).toBe(0);
  });

  it("removes the token on clear", () => {
    const storage = createStorage();

    saveSessionAccessToken("token", storage);
    clearSessionAccessToken(storage);

    expect(loadSessionAccessToken(storage)).toBeNull();
  });
});
