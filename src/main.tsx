import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { router } from "@/routes/index";
import { queryClient } from "@/lib/query-client";
import { initTheme } from "@/store/theme.store";
import { restoreSession } from "@/services/auth-session.service";
import "./index.css";

// Aplica o tema antes de montar o React para evitar flash
initTheme();

async function bootstrap() {
  await restoreSession();

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" closeButton />
      </QueryClientProvider>
    </React.StrictMode>
  );
}

void bootstrap();
