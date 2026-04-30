import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Clock3, ExternalLink, FileText, Shield, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { rhService } from "@/services/rh.service";
import type { RhFuncionario } from "@/types/rh.types";
import { PermissionGate } from "../../shared/components/PermissionGate";
import { RhStatusBadge } from "../../shared/components/RhStatusBadge";
import { RhTableSkeleton } from "../../shared/components/RhTableSkeleton";
import { useCompetenceState } from "../../shared/hooks/useCompetenceState";
import { formatCompetence, formatRhCurrency, formatRhDate } from "../../shared/utils/formatters";
import { rhPaths } from "../../shared/utils/paths";
import { rhQueryKeys } from "../../shared/utils/queryKeys";
import { useAtestados } from "../../atestados/hooks/useAtestadosOperacionais";
import { useFerias } from "../../ferias/hooks/useFeriasOperacionais";
import { useFolha } from "../../folha/hooks/useFolha";
import { usePontos } from "../../ponto/hooks/usePontoOperacional";

type OperationalScope = "all" | "ponto" | "ausencias" | "holerites" | "auditoria";

export function FuncionarioOperationalSummary({
  funcionario,
  scope = "all",
}: {
  funcionario: RhFuncionario;
  scope?: OperationalScope;
}) {
  const show = (next: OperationalScope) => scope === "all" || scope === next;

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {show("ponto") ? <PermissionGate permission="rh.ponto.view">
        <PontoResumo funcionarioId={funcionario.id} />
      </PermissionGate> : null}
      {show("ausencias") ? <AusenciasResumo funcionarioId={funcionario.id} /> : null}
      {show("holerites") ? <PermissionGate permission="rh.folha.view">
        <HoleritesResumo funcionarioId={funcionario.id} />
      </PermissionGate> : null}
      {show("auditoria") ? <PermissionGate permission="rh.auditoria.view">
        <AuditoriaResumo funcionario={funcionario} />
      </PermissionGate> : null}
    </div>
  );
}

function PontoResumo({ funcionarioId }: { funcionarioId: string }) {
  const query = usePontos({ page: 1, limit: 4, funcionario_id: funcionarioId });
  const registros = query.data?.items ?? [];

  return (
    <SummaryCard
      icon={<Clock3 className="size-5" />}
      title="Ponto"
      description="Ultimos registros e situacao do dia."
      to={`${rhPaths.ponto}?funcionario_id=${funcionarioId}`}
      actionLabel="Ver registros"
    >
      {query.isLoading ? <RhTableSkeleton rows={2} /> : (
        <div className="flex flex-col gap-2">
          {registros.length ? registros.map((registro) => (
            <div key={registro.id} className="flex items-center justify-between gap-3 rounded-md bg-muted/40 p-2 text-sm">
              <span>{formatRhDate(registro.timestamp)}</span>
              <RhStatusBadge status={registro.status} />
            </div>
          )) : <p className="text-sm text-muted-foreground">Nenhum registro recente encontrado.</p>}
        </div>
      )}
    </SummaryCard>
  );
}

function AusenciasResumo({ funcionarioId }: { funcionarioId: string }) {
  const ferias = useFerias({ page: 1, limit: 3, funcionario_id: funcionarioId });
  const atestados = useAtestados({ page: 1, limit: 3, funcionario_id: funcionarioId });

  return (
    <PermissionGate permission="rh.ferias.view">
      <SummaryCard
        icon={<CalendarDays className="size-5" />}
        title="Ferias e atestados"
        description="Solicitacoes recentes relacionadas ao colaborador."
        to={`${rhPaths.ferias}?funcionario_id=${funcionarioId}`}
        actionLabel="Ver ferias"
        secondaryTo={`${rhPaths.atestados}?funcionario_id=${funcionarioId}`}
        secondaryLabel="Ver atestados"
      >
        {ferias.isLoading || atestados.isLoading ? <RhTableSkeleton rows={2} /> : (
          <div className="grid gap-2 md:grid-cols-2">
            <MiniList
              title="Ferias"
              empty="Sem ferias recentes."
              items={(ferias.data?.items ?? []).map((item) => ({
                id: item.id,
                label: `${formatRhDate(item.data_inicio)} a ${formatRhDate(item.data_fim)}`,
                status: item.status,
              }))}
            />
            <MiniList
              title="Atestados"
              empty="Sem atestados recentes."
              items={(atestados.data?.items ?? []).map((item) => ({
                id: item.id,
                label: `${formatRhDate(item.data_inicio)} a ${formatRhDate(item.data_fim)}`,
                status: item.status,
              }))}
            />
          </div>
        )}
      </SummaryCard>
    </PermissionGate>
  );
}

function HoleritesResumo({ funcionarioId }: { funcionarioId: string }) {
  const competence = useCompetenceState();
  const query = useFolha({ page: 1, limit: 3, mes: competence.month, ano: competence.year, funcionario_id: funcionarioId });

  return (
    <SummaryCard
      icon={<Wallet className="size-5" />}
      title="Holerites"
      description={`Competencia ${formatCompetence(competence.month, competence.year)}.`}
      to={`${rhPaths.holerites}?funcionario_id=${funcionarioId}`}
      actionLabel="Ver holerites"
    >
      {query.isLoading ? <RhTableSkeleton rows={2} /> : (
        <div className="flex flex-col gap-2">
          {(query.data?.items ?? []).length ? query.data!.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 rounded-md bg-muted/40 p-2 text-sm">
              <span>{formatCompetence(item.mes_referencia, item.ano_referencia)}</span>
              <span className="font-medium">{formatRhCurrency(item.valor_liquido)}</span>
            </div>
          )) : <p className="text-sm text-muted-foreground">Nenhum holerite recente encontrado.</p>}
        </div>
      )}
    </SummaryCard>
  );
}

function AuditoriaResumo({ funcionario }: { funcionario: RhFuncionario }) {
  const query = useQuery({
    queryKey: rhQueryKeys.auditoria.list({ page: 1, limit: 3, entity_search: funcionario.nome }),
    queryFn: () => rhService.listAuditLogs({ page: 1, limit: 3, entity_search: funcionario.nome }),
    staleTime: 30_000,
  });

  return (
    <SummaryCard
      icon={<Shield className="size-5" />}
      title="Auditoria"
      description="Eventos administrativos relacionados ao colaborador."
      to={`${rhPaths.auditoria}?entity_search=${encodeURIComponent(funcionario.nome)}`}
      actionLabel="Ver auditoria"
    >
      {query.isLoading ? <RhTableSkeleton rows={2} /> : (
        <div className="flex flex-col gap-2">
          {(query.data?.items ?? []).length ? query.data!.items.map((item) => (
            <div key={item.id} className="rounded-md bg-muted/40 p-2 text-sm">
              <p className="font-medium">{item.action}</p>
              <p className="text-xs text-muted-foreground">{formatRhDate(item.created_at)}</p>
            </div>
          )) : <p className="text-sm text-muted-foreground">Nenhum evento recente encontrado.</p>}
        </div>
      )}
    </SummaryCard>
  );
}

function MiniList({ title, empty, items }: { title: string; empty: string; items: Array<{ id: string; label: string; status: string }> }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">{title}</p>
      {items.length ? items.map((item) => (
        <div key={item.id} className="rounded-md bg-muted/40 p-2 text-sm">
          <p>{item.label}</p>
          <RhStatusBadge status={item.status} />
        </div>
      )) : <p className="text-sm text-muted-foreground">{empty}</p>}
    </div>
  );
}

function SummaryCard({
  icon,
  title,
  description,
  children,
  to,
  actionLabel,
  secondaryTo,
  secondaryLabel,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
  to: string;
  actionLabel: string;
  secondaryTo?: string;
  secondaryLabel?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {children}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to={to}>
              <ExternalLink className="size-4" />
              {actionLabel}
            </Link>
          </Button>
          {secondaryTo && secondaryLabel ? (
            <Button variant="outline" size="sm" asChild>
              <Link to={secondaryTo}>
                <FileText className="size-4" />
                {secondaryLabel}
              </Link>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
