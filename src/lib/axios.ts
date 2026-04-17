import axios from "axios";
import { useAuthStore } from "@/store/auth.store";

type QueueItem = {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
};

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token!);
  });
  failedQueue = [];
}

// Aguarda o bootstrap terminar antes de prosseguir.
// Cobre tanto isBootstrapping=true quanto o frame inicial onde ambas as flags
// são false (antes do useEffect do ProtectedRoute disparar restoreSession).
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

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL as string,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Injeta access_token em toda request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de response — refresh automático ao receber 401
api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (
      !error ||
      typeof error !== "object" ||
      !("config" in error) ||
      !("response" in error)
    ) {
      return Promise.reject(error);
    }

    const axiosError = error as {
      config: { _retry?: boolean; headers: Record<string, string> } & object;
      response?: { status: number };
    };

    const originalRequest = axiosError.config;
    const status = axiosError.response?.status;
    const requestUrl =
      typeof (originalRequest as { url?: unknown }).url === "string"
        ? ((originalRequest as { url?: string }).url as string)
        : "";
    const isRefreshRequest = requestUrl.includes("/auth/refresh");

    // Nunca tenta "refresh do refresh"
    if (status === 401 && isRefreshRequest) {
      return Promise.reject(error);
    }

    if (status === 401 && !originalRequest._retry) {
      // Se o bootstrap ainda está em andamento OU ainda não começou (frame
      // inicial antes do useEffect do ProtectedRoute), aguarda terminar e
      // retenta com o token que ele definiu — evita refresh paralelo.
      const { isBootstrapping, hasBootstrapped } = useAuthStore.getState();
      if (isBootstrapping || !hasBootstrapped) {
        await waitForBootstrap();
        const newToken = useAuthStore.getState().accessToken;
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          originalRequest._retry = true;
          return api(originalRequest);
        }
        return Promise.reject(error);
      }

      // FIX 1: Requests concorrentes entram na fila e recebem _retry = true
      // antes de retentar, evitando loop de refresh se o retry receber outro 401.
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest._retry = true;
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post<{ access_token: string }>(
          `${import.meta.env.VITE_API_BASE_URL as string}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = data.access_token;
        useAuthStore.getState().setAccessToken(newToken);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        // FIX 2: await garante que isRefreshing só é resetado após o retry
        // concluir, evitando que um 401 chegando nesse intervalo dispare
        // um novo ciclo de refresh em paralelo.
        const retryResponse = await api(originalRequest);
        return retryResponse;
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        if (window.location.pathname !== "/login") {
          window.location.assign("/login");
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
