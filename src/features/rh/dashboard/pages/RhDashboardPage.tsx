import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CalendarCheck,
  ClipboardCheck,
  FileClock,
  FileText,
  LayoutDashboard,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PermissionGate } from "../../shared/components/PermissionGate";
import { RhErrorState } from "../../shared/components/RhErrorState";
import { RhMetricCard } from "../../shared/components/RhMetricCard";
import { RhPageHeader } from "../../shared/components/RhPageHeader";
import { useCompetenceState } from "../../shared/hooks/useCompetenceState";
import { formatCompetence, formatRhCurrency } from "../../shared/utils/formatters";
import { rhPaths } from "../../shared/utils/paths";
import { useRhDashboard } from "../hooks/useRhDashboard";

const shortcuts = [
  {
    to: rhPaths.funcionarios,
    title: "Funcionarios",
    description: "Cadastros, vinculos, jornada e dados contratuais.",
    icon: Users,
    enabled: true,
  },
  {
    to: rhPaths.ponto,
    title: "Ponto",
    description: "Registros, inconsistencias e ajustes em filas separadas.",
    icon: ClipboardCheck,
    enabled: true,
  },
  {
    to: rhPaths.ferias,
    title: "Ferias e atestados",
    description: "Solicitacoes, prazos e impacto operacional.",
    icon: CalendarCheck,
    enabled: true,
  },
  {
    to: rhPaths.folha,
    title: "Folha",
    description: "Rascunhos, ajustes manuais, holerites e fechamento.",
    icon: Wallet,
    enabled: true,
  },
  {
    to: rhPaths.configuracoes,
    title: "Configuracoes",
    description: "Regras avancadas separadas da operacao diaria.",
    icon: FileText,
    enabled: true,
  },
];

export function RhDashboardPage() {
  const { month, year, setMonth, setYear } = useCompetenceState();
  const dashboardQuery = useRhDashboard(month, year);
  const summary = dashboardQuery.data;

  return (
    <PermissionGate permission="rh.dashboard.view" showDeniedState>
      <div className="flex flex-col gap-6">
        <RhPageHeader
          title="RH"
          description="Resumo operacional da competencia e acesso rapido aos fluxos principais."
          actions={
            <Button variant="outline" asChild>
              <Link to={rhPaths.funcionarios}>Ver funcionarios</Link>
            </Button>
          }
        />

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <LayoutDashboard className="size-5" />
                  Competencia {formatCompetence(month, year)}
                </CardTitle>
                <CardDescription>Use a competencia para revisar folha, ponto e pendencias relacionadas.</CardDescription>
              </div>
              <div className="flex gap-3">
                <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
                  Mes
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    value={month}
                    onChange={(event) => setMonth(Number(event.target.value))}
                    className="w-24"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
                  Ano
                  <Input
                    type="number"
                    min={2020}
                    max={2100}
                    value={year}
                    onChange={(event) => setYear(Number(event.target.value))}
                    className="w-28"
                  />
                </label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {dashboardQuery.isLoading ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 7 }).map((_, index) => (
                  <Skeleton key={index} className="h-28" />
                ))}
              </div>
            ) : dashboardQuery.isError ? (
              <RhErrorState onRetry={() => dashboardQuery.refetch()} />
            ) : summary ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <RhMetricCard title="Funcionarios ativos" value={summary.total_funcionarios_ativos} icon={<Users className="size-5" />} />
                <RhMetricCard title="Ajustes pendentes" value={summary.ajustes_pendentes} icon={<ClipboardCheck className="size-5" />} />
                <RhMetricCard title="Inconsistencias de ponto" value={summary.pontos_inconsistentes_periodo} icon={<AlertTriangle className="size-5" />} />
                <RhMetricCard title="Ferias aguardando" value={summary.ferias_em_andamento} icon={<CalendarCheck className="size-5" />} />
                <RhMetricCard title="Atestados pendentes" value={summary.atestados_aguardando} icon={<FileClock className="size-5" />} />
                <RhMetricCard title="Holerites gerados" value={summary.holerites_rascunho + summary.holerites_fechados} icon={<FileText className="size-5" />} />
                <RhMetricCard title="Total liquido" value={formatRhCurrency(summary.total_liquido_competencia)} icon={<Wallet className="size-5" />} />
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-4">
          {shortcuts.map((shortcut) => (
            <Card key={shortcut.title} className={!shortcut.enabled ? "opacity-75" : undefined}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <shortcut.icon className="size-5" />
                  {shortcut.title}
                </CardTitle>
                <CardDescription>{shortcut.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {shortcut.enabled ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link to={shortcut.to}>Abrir</Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    Proxima fase
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PermissionGate>
  );
}
