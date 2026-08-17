import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { router } from "@/routes/index";
import { queryClient } from "@/lib/query-client";
import { AppErrorBoundary } from "@/components/layout/AppErrorBoundary";
import { clearChunkReloadMarker, reloadOnceForUpdatedChunks } from "@/lib/chunk-reload";
import { initTheme } from "@/store/theme.store";
import { startVersionWatcher } from "@/lib/app-version";
import "./index.css";

// Aplica o tema antes de montar o React para evitar flash
initTheme();
clearChunkReloadMarker();
startVersionWatcher();

/**
 * Falha de carregamento de <script>/<link> para /assets/ (ex.: hash antigo que
 * o CDN nao tem mais, ou um proxy devolvendo HTML no lugar do JS) nao vira uma
 * excecao React — o elemento so dispara "error" e nada renderiza. Esse evento
 * nao faz bubble, por isso o listener precisa estar em capture. Uma tentativa
 * de reload cobre o caso comum (deploy novo); se persistir, mostra uma
 * instrucao minima em HTML puro, ja que o proprio React pode nao ter montado.
 */
window.addEventListener(
  "error",
  (event) => {
    const target = event.target;
    if (!(target instanceof HTMLScriptElement) && !(target instanceof HTMLLinkElement)) {
      return;
    }
    const src = target instanceof HTMLScriptElement ? target.src : target.href;
    if (!src.includes("/assets/")) {
      return;
    }
    if (reloadOnceForUpdatedChunks()) {
      return;
    }
    const root = document.getElementById("root");
    if (root && !root.hasChildNodes()) {
      root.innerHTML =
        '<div style="display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px;font-family:system-ui,sans-serif;text-align:center;">' +
        '<div><p style="margin-bottom:12px;">Nao foi possivel carregar a aplicacao. Feche e reabra o app, ou limpe os dados do site.</p>' +
        '<button onclick="window.location.reload()" style="padding:8px 16px;border-radius:6px;border:1px solid #ccc;cursor:pointer;">Tentar novamente</button></div></div>';
    }
  },
  true
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppErrorBoundary>
        <RouterProvider router={router} />
      </AppErrorBoundary>
      <Toaster richColors position="top-right" closeButton />
    </QueryClientProvider>
  </React.StrictMode>
);

if ("serviceWorker" in navigator && !import.meta.env.DEV) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("Service Worker registrado com sucesso:", reg);
        void reg.update();
      })
      .catch((err) => {
        console.error("Falha ao registrar Service Worker:", err);
      });
  });
}
