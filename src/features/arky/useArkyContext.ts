import { useLocation } from "react-router-dom";
import type { ScreenContext, SelectionContext, UIState } from "./arky.types";

/**
 * Builds the structured screen context from the current React Router location.
 * This is "hint" data for Arky — the backend always recalculates permissions.
 */
export function useArkyScreenContext(): ScreenContext {
  const location = useLocation();

  const module = detectModule(location.pathname);
  const title = detectTitle(location.pathname);

  return {
    route: normalizeRoute(location.pathname),
    path: location.pathname,
    title,
    module,
  };
}

export function buildSelectionContext(
  entityType: string,
  entityId?: string | null
): SelectionContext {
  return { entity_type: entityType, entity_id: entityId };
}

export function buildUIState(opts: {
  filters?: Record<string, unknown> | null;
  visibleTab?: string | null;
}): UIState {
  return {
    filters: opts.filters ?? null,
    visible_tab: opts.visibleTab ?? null,
  };
}

function detectModule(pathname: string): string {
  if (pathname.startsWith("/financeiro")) return "financeiro";
  if (pathname.startsWith("/rh")) return "rh";
  if (pathname.startsWith("/obras")) return "obras";
  if (pathname.startsWith("/items")) return "obras";
  if (pathname.startsWith("/mural")) return "mural";
  if (pathname.startsWith("/notificacoes")) return "notificacoes";
  if (pathname.startsWith("/usuarios")) return "users";
  if (pathname.startsWith("/time")) return "teams";
  return "geral";
}

function detectTitle(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (!segments.length) return "Dashboard";

  const labels: Record<string, string> = {
    obras: "Obras",
    financeiro: "Financeiro",
    rh: "RH",
    mural: "Mural",
    notificacoes: "Notificações",
    usuarios: "Usuários",
    time: "Time",
    dashboard: "Dashboard",
  };
  return labels[segments[0]] ?? segments[0];
}

function normalizeRoute(pathname: string): string {
  // Replace UUIDs with :id placeholders for consistent routing context
  return pathname.replace(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    ":id"
  );
}
