import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Role } from "@/types/auth.types";

export interface AuthUser {
  id: string;
  nome: string;
  email: string;
  role: Role;
  teamId: string;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  hasBootstrapped: boolean;
  setAuth: (token: string, user: AuthUser) => void;
  setAccessToken: (token: string) => void;
  setUser: (user: AuthUser) => void;
  startBootstrap: () => void;
  finishBootstrap: () => void;
  clearAuth: () => void;
  logout: () => void;
}

type PersistedAuthState = Partial<Pick<AuthState, "user">> & {
  accessToken?: unknown;
  isAuthenticated?: unknown;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      isBootstrapping: false,
      hasBootstrapped: false,

      setAuth: (token, user) =>
        set({ accessToken: token, user, isAuthenticated: true }),

      setAccessToken: (token) =>
        set({ accessToken: token }),

      setUser: (user) => set({ user }),

      startBootstrap: () => set({ isBootstrapping: true }),

      finishBootstrap: () =>
        set({ isBootstrapping: false, hasBootstrapped: true }),

      clearAuth: () =>
        set({ accessToken: null, user: null, isAuthenticated: false }),

      logout: () =>
        set({
          accessToken: null,
          user: null,
          isAuthenticated: false,
          isBootstrapping: false,
          hasBootstrapped: true,
        }),
    }),
    {
      name: "engify-auth",
      storage: createJSONStorage(() => localStorage),
      version: 2,
      migrate: (persistedState) => {
        const state = persistedState as PersistedAuthState;
        return {
          user: state.user ?? null,
        };
      },
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
