import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { HardHat, CalendarDays, TrendingUp, TrendingDown } from "lucide-react";
import { startOfMonth, endOfDay, formatISO } from "date-fns";
import { PageTransition } from "@/components/layout/PageTransition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { obrasService } from "@/services/obras.service";
import { diariasService } from "@/services/diarias.service";
import { financeiroService } from "@/services/financeiro.service";
import { useAuthStore } from "@/store/auth.store";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ObraStatus } from "@/types/obra.types";

const statusVariants: Record<ObraStatus, "info" | "warning" | "success"> = {
  planejamento: "info",
  em_andamento: "warning",
  finalizado: "success",
};

const statusLabels: Record<ObraStatus, string> = {
  planejamento: "Planejamento",
  em_andamento: "Em Andamento",
  finalizado: "Finalizado",
};

export function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const canViewFinanceiro = user?.role === "admin" || user?.role === "financeiro";

  const now = new Date();
  const monthStart = formatISO(startOfMonth(now), { representation: "complete" });
  const monthEnd = formatISO(endOfDay(now), { representation: "complete" });

  const { data: obrasData, isLoading: obrasLoading } = useQuery({
    queryKey: ["obras", { limit: 6 }],
    queryFn: () => obrasService.list({ limit: 6 }),
  });

  const { data: diariasData, isLoading: diariasLoading } = useQuery({
    queryKey: ["diarias", { start: monthStart, end: monthEnd }],
    queryFn: () => diariasService.list({ start: monthStart, end: monthEnd, limit: 5 }),
  });

  const { data: finData } = useQuery({
    queryKey: ["financeiro", "movimentacoes", { limit: 5 }],
    queryFn: () => financeiroService.listMovimentacoes({ limit: 5 }),
    enabled: canViewFinanceiro,
  });

  const totalEntradas = finData?.items
    .filter((m) => m.type === "entrada")
    .reduce((s, m) => s + parseFloat(m.valor), 0) ?? 0;

  const totalSaidas = finData?.items
    .filter((m) => m.type === "saida")
    .reduce((s, m) => s + parseFloat(m.valor), 0) ?? 0;

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Bem-vindo, {user?.nome}!</p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Obras</CardTitle>
              <HardHat className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {obrasLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold">{obrasData?.total ?? 0}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Diárias no Mês</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {diariasLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold">{diariasData?.total ?? 0}</p>
              )}
            </CardContent>
          </Card>

          {canViewFinanceiro && (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Entradas (recentes)</CardTitle>
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(totalEntradas)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Saídas (recentes)</CardTitle>
                  <TrendingDown className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-destructive">
                    {formatCurrency(totalSaidas)}
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Obras recentes */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Obras recentes</h2>
          {obrasLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {(obrasData?.items ?? []).map((obra) => (
                <Card
                  key={obra.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => navigate(`/obras/${obra.id}`)}
                >
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium">{obra.title}</p>
                      {obra.data_entrega && (
                        <p className="text-xs text-muted-foreground">
                          Entrega: {formatDate(obra.data_entrega)}
                        </p>
                      )}
                    </div>
                    <Badge variant={statusVariants[obra.status]}>{statusLabels[obra.status]}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Diárias recentes */}
        {diariasData && diariasData.items.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Diárias este mês</h2>
            <div className="space-y-2">
              {diariasData.items.map((d) => (
                <Card key={d.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium">{d.diarist_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.obra_title} · {formatDate(d.data)}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground">{d.quantidade}x</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
