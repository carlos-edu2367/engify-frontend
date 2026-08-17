import { isRouteErrorResponse, useRouteError } from "react-router-dom";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isDynamicImportFetchError, reloadOnceForUpdatedChunks } from "@/lib/chunk-reload";
import { APP_VERSION } from "@/lib/app-version";

function errorDetail(error: unknown): string | null {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  return null;
}

export function RouteErrorElement() {
  const error = useRouteError();
  const isChunkError = isDynamicImportFetchError(error);

  if (isChunkError) {
    reloadOnceForUpdatedChunks();
  }

  // Sem isso a tela de erro nao deixa rastro: o usuario ve so "erro inesperado"
  // e nao ha nada no console para diagnosticar o que quebrou a rota.
  console.error("Route error boundary captured an error", error);

  const detail = errorDetail(error);
  const description = isRouteErrorResponse(error)
    ? `${error.status} - ${error.statusText}`
    : isChunkError
      ? "O aplicativo foi atualizado e precisa buscar os arquivos novos."
      : "Ocorreu um erro inesperado ao renderizar esta rota.";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg rounded-lg border p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-1 size-5 text-amber-600" />
          <div className="min-w-0">
            <h1 className="text-lg font-semibold">{isChunkError ? "Atualizando aplicacao" : "Erro ao abrir pagina"}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            {!isChunkError && detail ? (
              <p className="mt-2 break-words rounded bg-muted/50 p-2 font-mono text-xs text-muted-foreground">
                {detail}
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="size-4" />
            Recarregar
          </Button>
          <Button variant="outline" onClick={() => window.location.assign("/dashboard")}>
            Ir para o dashboard
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground/70">Versao {APP_VERSION}</p>
      </div>
    </div>
  );
}
