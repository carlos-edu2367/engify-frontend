import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

const setAccessToken = vi.hoisted(() => vi.fn());
const post = vi.hoisted(() => vi.fn());
const createdClient = vi.hoisted(() => ({
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
}));

vi.mock("axios", () => ({
  default: {
    post,
    create: vi.fn(() => createdClient),
    isAxiosError: vi.fn(),
  },
}));

vi.mock("@/store/auth.store", () => ({
  useAuthStore: {
    getState: () => ({
      setAccessToken,
    }),
    subscribe: vi.fn(),
  },
}));

describe("refreshAccessToken", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("VITE_API_BASE_URL", "https://api.example.com/api/v1");
    post.mockReset();
    setAccessToken.mockReset();
  });

  it("calls the refresh endpoint with browser credentials enabled", async () => {
    post.mockResolvedValueOnce({ data: { access_token: "new-access-token" } });

    const { refreshAccessToken } = await import("./axios");

    const token = await refreshAccessToken();

    expect(token).toBe("new-access-token");
    expect(axios.post).toHaveBeenCalledWith(
      "https://api.example.com/api/v1/auth/refresh",
      {},
      { withCredentials: true }
    );
    expect(setAccessToken).toHaveBeenCalledWith("new-access-token");
  });
});
