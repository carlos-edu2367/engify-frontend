import { create } from "zustand";

interface OnboardingState {
  key: string | null;
  cnpj: string | null;
  setKey: (key: string, cnpj: string) => void;
  clear: () => void;
}

// SEM persist — a key é de uso único e não deve sobreviver a reload da página
export const useOnboardingStore = create<OnboardingState>()((set) => ({
  key: null,
  cnpj: null,
  setKey: (key, cnpj) => set({ key, cnpj }),
  clear: () => set({ key: null, cnpj: null }),
}));
