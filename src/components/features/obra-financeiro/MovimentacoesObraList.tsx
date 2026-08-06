import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MonthYearFilter } from "@/components/features/financeiro/MonthYearFilter";
import { MovimentacaoDetailSheet } from "@/components/features/financeiro/MovimentacaoDetailSheet";
import { financeiroService } from "@/services/financeiro.service";
import { classeLabels } from "@/lib/financeiro-labels";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { MovClass, MovimentacaoResponse } from "@/types/financeiro.types";

interface MovimentacoesObraListProps {
  obraId: string;
  onRegistrarSaida: () => void;
}

const MONTH_NAMES_LONG = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function formatMesLabel(mes: string): string {
  const [year, month] = mes.split("-");
  return `${MONTH_NAMES_LONG[Number(month) - 1]}/${year}`;
}

export function MovimentacoesObraList({ obraId, onRegistrarSaida }: MovimentacoesObraListProps) {
  const queryClient = useQueryClient();
  const [mes, setMes] = useState("");
  const [classe, setClasse] = useState<MovClass | "all">("all");
  const [selectedMov, setSelectedMov] = useState<MovimentacaoResponse | null>(null);

  const filtroAtivo = !!mes || classe !== "all";

  const periodo = mes
    ? {
        start: `${mes}-01T00:00:00`,
        end: `${mes}-${new Date(Number(mes.slice(0, 4)), Number(mes.slice(5, 7)), 0).getDate()}T23:59:59`,
      }
    : null;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["obras", obraId, "financeiro", "movimentacoes", { mes, classe }],
    queryFn: () =>
      financeiroService.listMovimentacoes({
        limit: 50,
        obra_id: obraId,
        classe,
        period_start: periodo ? new Date(periodo.start).toISOString() : undefined,
        period_end: periodo ? new Date(periodo.end).toISOString() : undefined,
      }),
  });

  const movs = data?.items ?? [];

  function handleDeleted() {
    queryClient.invalidateQueries({ queryKey: ["obras", obraId, "financeiro"] });
  }

  function limparFiltros() {
    setMes("");
    setClasse("all");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold">Movimentações da obra</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Os filtros abaixo afetam só esta lista — não os números acima.
          </p>
        </div>
        <Button size="sm" onClick={onRegistrarSaida} className="shrink-0">
          <Plus className="h-4 w-4 mr-1" />
          Registrar saída
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <MonthYearFilter value={mes} onChange={setMes} />
        <div className="w-full sm:w-40">
          <Select value={classe} onValueChange={(v) => setClasse(v as MovClass | "all")}>
            <SelectTrigger className="h-9 truncate"><SelectValue placeholder="Classe" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas classes</SelectItem>
              {Object.entries(classeLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : isError ? (
        <div className="py-10 text-center border rounded-lg bg-card text-muted-foreground text-sm flex flex-col items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p>Não foi possível carregar as movimentações.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : movs.length === 0 ? (
        <div className="py-10 text-center border rounded-lg bg-card text-muted-foreground text-sm space-y-3">
          {filtroAtivo ? (
            <>
              <p>
                Nenhuma movimentação
                {mes ? ` em ${formatMesLabel(mes)}` : ""}
                {classe !== "all" ? ` com classe ${classeLabels[classe]}` : ""}.
              </p>
              <Button variant="outline" size="sm" onClick={limparFiltros}>
                Limpar filtros
              </Button>
            </>
          ) : (
            <>
              <p>Nenhuma movimentação nesta obra ainda.</p>
              <Button size="sm" onClick={onRegistrarSaida}>
                <Plus className="h-4 w-4 mr-1" />
                Registrar saída
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {movs.map((m) => (
            <Card
              key={m.id}
              className="cursor-pointer hover:border-primary/40 hover:shadow-md transition-all"
              onClick={() => setSelectedMov(m)}
            >
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{m.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {classeLabels[m.classe]} · {formatDate(m.data_movimentacao)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <p className={m.type === "entrada" ? "font-bold text-emerald-600 dark:text-emerald-400" : "font-bold text-destructive"}>
                    {m.type === "entrada" ? "+" : "−"}{formatCurrency(m.valor)}
                  </p>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <MovimentacaoDetailSheet
        mov={selectedMov}
        onClose={() => setSelectedMov(null)}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
