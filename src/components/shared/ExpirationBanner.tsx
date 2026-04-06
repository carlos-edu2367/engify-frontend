import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { teamsService } from "@/services/teams.service";
import { cn } from "@/lib/utils";

export function ExpirationBanner() {
  const [dismissed, setDismissed] = useState(false);

  const { data } = useQuery({
    queryKey: ["team", "expiration"],
    queryFn: () => teamsService.getExpiration(),
    staleTime: 1000 * 60 * 60, // 1 hora
  });

  const days = data?.days_to_expire ?? 99;

  if (dismissed || days > 3) return null;

  const isExpired = days <= 0;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-2 text-sm font-medium",
        isExpired
          ? "bg-destructive text-destructive-foreground"
          : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
      )}
    >
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span className="flex-1">
        {isExpired
          ? "Seu período de trial expirou. Algumas funcionalidades podem estar limitadas."
          : `Seu trial gratuito expira em ${days} dia${days === 1 ? "" : "s"}.`}
      </span>
      {!isExpired && (
        <button
          onClick={() => setDismissed(true)}
          className="rounded-sm opacity-70 hover:opacity-100 focus:outline-none"
          aria-label="Fechar aviso"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
