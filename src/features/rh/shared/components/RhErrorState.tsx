import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RhErrorState({
  title = "Nao foi possivel carregar os dados",
  description = "Tente novamente em instantes. Se o problema continuar, verifique suas permissoes ou acione o suporte.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 text-destructive" />
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {onRetry ? (
        <div>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Tentar novamente
          </Button>
        </div>
      ) : null}
    </div>
  );
}
