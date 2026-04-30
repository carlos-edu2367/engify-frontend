import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/auth.store";

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

let refreshPromise: Promise<string> | null = null;

function isAuthEndpoint(url: string | undefined, endpoint: string) {
  return typeof url === "string" && url.includes(endpoint);
}

function isAnonymousAuthRequest(url: string | undefined) {
  return (
    isAuthEndpoint(url, "/auth/login") ||
    isAuthEndpoint(url, "/auth/register") ||
    isAuthEndpoint(url, "/auth/refresh") ||
    isAuthEndpoint(url, "/auth/recovery")
  );
}

function waitForBootstrap(): Promise<void> {
  return new Promise((resolve) => {
    if (useAuthStore.getState().hasBootstrapped) {
      resolve();
      return;
    }

    const unsub = useAuthStore.subscribe((state) => {
      if (state.hasBootstrapped) {
        unsub();
        resolve();
      }
    });
  });
}

export async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<{ access_token: string }>(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true })
      .then(({ data }) => {
        useAuthStore.getState().setAccessToken(data.access_token);
        return data.access_token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

function redirectToLogin() {
  useAuthStore.getState().logout();
  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (isAnonymousAuthRequest(config.url)) {
    return config;
  }

  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;
    const status = error.response?.status;

    if (!originalRequest || status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isAuthEndpoint(originalRequest.url, "/auth/refresh")) {
      redirectToLogin();
      return Promise.reject(error);
    }

    const { isBootstrapping, hasBootstrapped } = useAuthStore.getState();
    if (isBootstrapping || !hasBootstrapped) {
      await waitForBootstrap();
      const bootstrapToken = useAuthStore.getState().accessToken;
      if (bootstrapToken) {
        originalRequest._retry = true;
        originalRequest.headers.Authorization = `Bearer ${bootstrapToken}`;
        return api(originalRequest);
      }
    }

    try {
      const token = await refreshAccessToken();
      originalRequest._retry = true;
      originalRequest.headers.Authorization = `Bearer ${token}`;
      return api(originalRequest);
    } catch (refreshError) {
      redirectToLogin();
      return Promise.reject(refreshError);
    }
  }
);
