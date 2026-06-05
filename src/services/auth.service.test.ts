import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

const authPost = vi.hoisted(() => vi.fn());
const apiPost = vi.hoisted(() => vi.fn());
const apiGet = vi.hoisted(() => vi.fn());
const refreshAccessToken = vi.hoisted(() => vi.fn());

vi.mock("axios", () => ({
  default: {
    create: vi.fn(() => ({
      post: authPost,
    })),
  },
}));

vi.mock("@/lib/axios", () => ({
  api: {
    post: apiPost,
    get: apiGet,
  },
  refreshAccessToken,
}));

describe("authService", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("VITE_API_BASE_URL", "https://api.example.com/api/v1");
    authPost.mockReset();
    apiPost.mockReset();
    apiGet.mockReset();
    refreshAccessToken.mockReset();
  });

  it("creates the login client with browser credentials enabled", async () => {
    authPost.mockResolvedValueOnce({ data: { access_token: "access-token" } });

    const { authService } = await import("./auth.service");

    const result = await authService.login({
      email: "user@example.com",
      senha: "secret",
    });

    expect(result).toEqual({ access_token: "access-token" });
    expect(axios.create).toHaveBeenCalledWith({
      baseURL: "https://api.example.com/api/v1",
      withCredentials: true,
      headers: { "Content-Type": "application/json" },
    });
    expect(authPost).toHaveBeenCalledWith("/auth/login", {
      email: "user@example.com",
      senha: "secret",
    });
  });
});
