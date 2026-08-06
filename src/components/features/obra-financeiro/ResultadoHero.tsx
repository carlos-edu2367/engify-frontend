import { AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { getEstadoMargem, ESTADO_MARGEM_CLASSES } from "./margem";
import type { ObraFinanceiroResumo } from "@/types/obra-financeiro.types";

interface ResultadoHeroProps {
  resumo: ObraFinanceiroResumo | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onDefinirContrato: () => void;
  onRegistrarSaida: () => void;
}

export function ResultadoHero({
  resumo,
  isLoading,
  isError,
  onRetry,
  onDefinirContrato,
  onRegistrarSaida,
}: ResultadoHeroProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border/60 bg-card p-6 space-y-3">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-6 w-48" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-border/60 bg-card p-6 flex flex-col items-center justify-center text-center gap-3 min-h-[180px]">
        <AlertCircle className="h-6 w-6 text-destructive" />
        <p className="text-sm font-medium">Não foi possível carregar o resumo financeiro</p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!resumo) return null;

  const semLancamentos = resumo.qtd_movimentacoes === 0 && resumo.qtd_pagamentos_aguardando === 0;

  if (semLancamentos) {
    return (
      <div className="rounded-lg border border-border/60 bg-card p-6 flex flex-col items-center justify-center text-center gap-3 min-h-[180px]">
        <p className="text-base font-medium">Nenhum lançamento nesta obra ainda</p>
        <p className="text-sm text-muted-foreground max-w-sm">
          Assim que houver movimentações ou pagamentos vinculados a esta obra, o resultado
          financeiro aparece aqui.
        </p>
        <Button size="sm" onClick={onRegistrarSaida}>
          <Plus className="h-4 w-4 mr-1" />
          Registrar saída
        </Button>
      </div>
    );
  }

  const semContrato = resumo.contrato === null;

  if (semContrato) {
    return (
      <div className="rounded-lg border border-border/60 bg-card p-6 space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Realizado até hoje
        </p>
        <p className="text-4xl sm:text-5xl font-bold tabular-nums text-foreground">
          {formatCurrency(resumo.resultado_realizado)}
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <p className="text-sm text-muted-foreground">
            Defina o valor do contrato para ver a margem projetada.
          </p>
          <Button variant="outline" size="sm" onClick={onDefinirContrato}>
            Definir contrato
          </Button>
        </div>
      </div>
    );
  }

  const estado = getEstadoMargem(resumo.margem_projetada, resumo.margem_projetada_pct);
  const corMargem = ESTADO_MARGEM_CLASSES[estado];
  const contratoNum = Number(resumo.contrato);
  const custoPrevistoNum = Number(resumo.custo_previsto);
  const barraPct = contratoNum > 0 ? Math.min(100, (custoPrevistoNum / contratoNum) * 100) : 0;

  return (
    <div className="rounded-lg border border-border/60 bg-card p-6 space-y-4">
      <div>
        <p className={`text-4xl sm:text-5xl font-bold tabular-nums ${corMargem}`}>
          {formatCurrency(resumo.margem_projetada!)}
        </p>
        <div className="mt-2 flex items-center gap-3">
          <p className="text-sm text-muted-foreground">
            {resumo.margem_projetada_pct !== null
              ? `${Number(resumo.margem_projetada_pct).toFixed(2)}% do contrato`
              : "Percentual indisponível"}
          </p>
        </div>
        <div className="mt-2 w-full bg-muted rounded-full h-1.5 max-w-md">
          <div
            className={`h-1.5 rounded-full transition-all ${
              estado === "prejuizo" ? "bg-destructive" : "bg-primary"
            }`}
            style={{ width: `${barraPct}%` }}
          />
        </div>
      </div>

      <div className="pt-2 border-t border-border/40">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Realizado até hoje
        </p>
        <p className="text-lg font-semibold tabular-nums text-muted-foreground">
          {formatCurrency(resumo.resultado_realizado)}
        </p>
      </div>
    </div>
  );
}
