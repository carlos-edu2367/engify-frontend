import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Role } from "@/types/auth.types";
import { clearSessionAccessToken, saveSessionAccessToken } from "@/services/auth-session-token";

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

      setAuth: (token, user) => {
        saveSessionAccessToken(token);
        set({ accessToken: token, user, isAuthenticated: true });
      },

      setAccessToken: (token) => {
        saveSessionAccessToken(token);
        set({ accessToken: token });
      },

      setUser: (user) => set({ user }),

      startBootstrap: () => set({ isBootstrapping: true }),

      finishBootstrap: () =>
        set({ isBootstrapping: false, hasBootstrapped: true }),

      clearAuth: () => {
        clearSessionAccessToken();
        set({ accessToken: null, user: null, isAuthenticated: false });
      },

      logout: () => {
        clearSessionAccessToken();
        set({
          accessToken: null,
          user: null,
          isAuthenticated: false,
          isBootstrapping: false,
          hasBootstrapped: true,
        });
      },
    }),
    {
      name: "engify-auth",
      storage: createJSONStorage(() => localStorage),
      version: 3,
      migrate: (persistedState) => {
        const state = (persistedState ?? {}) as PersistedAuthState;
        return {
          user: state.user ?? null,
        };
      },
      partialize: (state) => ({
        user: state.user,
      }),
    }
  )
);
