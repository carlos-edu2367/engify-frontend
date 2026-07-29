import { AlertTriangle, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SessionBootstrapErrorProps {
  message: string;
  onRetry: () => void;
  compact?: boolean;
  showLogin?: boolean;
}

export function SessionBootstrapError({
  message,
  onRetry,
  compact = false,
  showLogin = false,
}: SessionBootstrapErrorProps) {
  if (compact) {
    return (
      <div
        role="alert"
        className="flex flex-wrap items-center justify-center gap-3 border-b border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm"
      >
        <span className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
          <WifiOff className="size-4 shrink-0" />
          {message}
        </span>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="size-4" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div
        role="alert"
        className="w-full max-w-lg rounded-lg border border-amber-500/30 bg-card p-6 shadow-sm"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-1 size-5 text-amber-600" />
          <div>
            <h1 className="text-lg font-semibold">Não foi possível abrir o aplicativo</h1>
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={onRetry}>
            <RefreshCw className="size-4" />
            Tentar novamente
          </Button>
          {showLogin && (
            <Button variant="outline" onClick={() => window.location.assign("/login")}>
              Ir para o login
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
