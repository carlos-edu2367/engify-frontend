import { isRouteErrorResponse, useRouteError } from "react-router-dom";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isDynamicImportFetchError, reloadOnceForUpdatedChunks } from "@/lib/chunk-reload";

export function RouteErrorElement() {
  const error = useRouteError();
  const isChunkError = isDynamicImportFetchError(error);

  if (isChunkError) {
    reloadOnceForUpdatedChunks();
  }

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
          <div>
            <h1 className="text-lg font-semibold">{isChunkError ? "Atualizando aplicacao" : "Erro ao abrir pagina"}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
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
      </div>
    </div>
  );
}
