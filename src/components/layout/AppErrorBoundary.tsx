import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isDynamicImportFetchError, reloadOnceForUpdatedChunks } from "@/lib/chunk-reload";

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
  autoReloading: boolean;
};

export class AppErrorBoundary extends Component<Props, State> {
  state: State = {
    error: null,
    autoReloading: false,
  };

  static getDerivedStateFromError(error: Error): State {
    return { error, autoReloading: false };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Application error boundary captured an error", error, errorInfo);

    if (isDynamicImportFetchError(error)) {
      const reloading = reloadOnceForUpdatedChunks();
      if (reloading) {
        this.setState({ autoReloading: true });
      }
    }
  }

  render() {
    const { error, autoReloading } = this.state;

    if (!error) {
      return this.props.children;
    }

    const isChunkError = isDynamicImportFetchError(error);

    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-lg border bg-background p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-1 size-5 text-amber-600" />
            <div className="space-y-2">
              <h1 className="text-lg font-semibold">
                {isChunkError ? "Atualizacao disponivel" : "Nao foi possivel carregar esta tela"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isChunkError
                  ? "O aplicativo foi atualizado enquanto sua sessao ainda usava arquivos antigos. Vamos carregar a versao mais recente."
                  : "A tela encontrou um erro inesperado. Tente recarregar a pagina."}
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={() => window.location.reload()} disabled={autoReloading}>
              <RefreshCw className="size-4" />
              {autoReloading ? "Atualizando..." : "Recarregar"}
            </Button>
            <Button variant="outline" onClick={() => window.location.assign("/dashboard")}>
              Ir para o dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
