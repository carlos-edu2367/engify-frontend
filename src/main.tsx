import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { router } from "@/routes/index";
import { queryClient } from "@/lib/query-client";
import { AppErrorBoundary } from "@/components/layout/AppErrorBoundary";
import { clearChunkReloadMarker } from "@/lib/chunk-reload";
import { initTheme } from "@/store/theme.store";
import { restoreSession } from "@/services/auth-session.service";
import "./index.css";

// Aplica o tema antes de montar o React para evitar flash
initTheme();
clearChunkReloadMarker();

async function bootstrap() {
  await restoreSession();

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
}

void bootstrap();
