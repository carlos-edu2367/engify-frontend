import path from "path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    // O bug de fuso so aparece fora de UTC. Fixar o fuso do runner no fuso
    // real da operacao garante que uma regressao quebre o teste.
    env: { TZ: "America/Sao_Paulo" },
  },
});
