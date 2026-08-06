import { AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import type { ObraFinanceiroResumo } from "@/types/obra-financeiro.types";

interface ResumoStatRowProps {
  resumo: ObraFinanceiroResumo | undefined;
  isLoading: boolean;
}

interface Celula {
  label: string;
  content: React.ReactNode;
}

export function ResumoStatRow({ resumo, isLoading }: ResumoStatRowProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-lg border border-border/60 bg-border/60 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card p-4 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (!resumo) return null;

  const aReceberNum = resumo.a_receber !== null ? Number(resumo.a_receber) : null;
  const divergeTotalRecebido =
    Number(resumo.entradas).toFixed(2) !== Number(resumo.total_recebido_obra).toFixed(2);

  const celulas: Celula[] = [
    {
      label: "Contrato",
      content: resumo.contrato !== null
        ? formatCurrency(resumo.contrato)
        : <span className="text-muted-foreground">—</span>,
    },
    {
      label: "Recebido",
      content: (
        <div>
          <span>{formatCurrency(resumo.total_recebido_obra)}</span>
          {aReceberNum !== null && aReceberNum < 0 && (
            <p className="text-xs font-normal text-muted-foreground normal-case mt-0.5">
              {formatCurrency(Math.abs(aReceberNum))} acima do contrato
            </p>
          )}
        </div>
      ),
    },
    {
      label: "Custo pago",
      content: formatCurrency(resumo.saidas),
    },
    {
      label: "Comprometido",
      content: formatCurrency(resumo.comprometido),
    },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 sm:divide-x divide-border/60 rounded-lg border border-border/60 bg-card overflow-hidden">
        {celulas.map((c) => (
          <div key={c.label} className="p-4 border-b sm:border-b-0 border-border/60 last:border-b-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {c.label}
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {c.content}
            </p>
          </div>
        ))}
      </div>

      {divergeTotalRecebido && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>
            O total registrado na obra difere da soma das entradas ({formatCurrency(resumo.entradas)}).
          </span>
        </div>
      )}
    </div>
  );
}
