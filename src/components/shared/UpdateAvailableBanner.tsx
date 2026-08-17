import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { isNewVersionAvailable, onNewVersionAvailable } from "@/lib/app-version";

export function UpdateAvailableBanner() {
  const [available, setAvailable] = useState(isNewVersionAvailable);

  useEffect(() => onNewVersionAvailable(() => setAvailable(true)), []);

  if (!available) return null;

  return (
    <div className="flex items-center gap-2 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
      <RefreshCw className="h-4 w-4 shrink-0" />
      <span className="flex-1">Uma nova versao do Engify esta disponivel.</span>
      <button
        onClick={() => window.location.reload()}
        className="rounded-md bg-primary-foreground/15 px-3 py-1 font-semibold hover:bg-primary-foreground/25 focus:outline-none"
      >
        Atualizar agora
      </button>
    </div>
  );
}
