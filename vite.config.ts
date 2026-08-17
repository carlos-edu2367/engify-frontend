import path from "path";
import { writeFileSync } from "fs";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Identifica o build de forma estavel: o SHA do commit na Vercel, ou um
// timestamp em dev/preview local. E usado para detectar, no cliente, quando
// uma sessao aberta ha dias ainda esta rodando um bundle antigo.
const appVersion = process.env.VERCEL_GIT_COMMIT_SHA ?? `dev-${Date.now()}`;

function versionFilePlugin() {
  return {
    name: "engify-version-file",
    apply: "build" as const,
    closeBundle() {
      writeFileSync(
        path.resolve(__dirname, "dist/version.json"),
        JSON.stringify({ version: appVersion })
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), versionFilePlugin()],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
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
