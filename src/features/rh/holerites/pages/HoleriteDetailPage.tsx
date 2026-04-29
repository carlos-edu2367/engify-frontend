import { useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { FileText, Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PermissionGate } from "../../shared/components/PermissionGate";
import { RhErrorState } from "../../shared/components/RhErrorState";
import { RhMetricCard } from "../../shared/components/RhMetricCard";
import { RhPageHeader } from "../../shared/components/RhPageHeader";
import { RhStatusBadge } from "../../shared/components/RhStatusBadge";
import { HoleriteBreakdown } from "../../shared/components/HoleriteBreakdown";
import { employeeDisplay } from "../../shared/utils/display";
import { formatCompetence, formatRhCurrency } from "../../shared/utils/formatters";
import { rhService } from "@/services/rh.service";
import type { RhHoleriteSnapshot } from "@/types/rh.types";
import { useHoleriteDetail, useHoleriteItens } from "../../folha/hooks/useFolha";
import { useState } from "react";

export function HoleriteDetailPage() {
  const { id } = useParams();
  const query = useHoleriteDetail(id);
  const itensQuery = useHoleriteItens(id);
  const [snapshots, setSnapshots] = useState<Record<string, RhHoleriteSnapshot | undefined>>({});
  const snapshotMutation = useMutation({
    mutationFn: ({ itemId }: { itemId: string }) => rhService.getHoleriteItemSnapshot(id!, itemId),
    onSuccess: (snapshot, variables) => setSnapshots((current) => ({ ...current, [variables.itemId]: snapshot })),
  });
  const item = query.data;
  const display = employeeDisplay(item);

  return (
    <PermissionGate permission="rh.folha.view" showDeniedState>
      <div className="flex flex-col gap-6">
        <RhPageHeader title="Holerite" description="Resumo claro primeiro, composicao e detalhes tecnicos recolhidos abaixo." />
        {query.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-28" />
            <Skeleton className="h-56" />
          </div>
        ) : query.isError ? (
          <RhErrorState onRetry={() => query.refetch()} />
        ) : item ? (
          <>
            <div className="grid gap-3 md:grid-cols-3">
              <RhMetricCard title="Liquido" value={formatRhCurrency(item.valor_liquido)} icon={<Wallet className="size-5" />} />
              <RhMetricCard title="Competencia" value={formatCompetence(item.mes_referencia, item.ano_referencia)} icon={<FileText className="size-5" />} />
              <Card>
                <CardContent className="flex h-full items-center justify-between p-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="mt-2"><RhStatusBadge status={item.status} /></div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Composicao</CardTitle>
                <CardDescription>Valores congelados quando o holerite esta fechado.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                <Detail label="Funcionario" value={`${display.title} · ${display.subtitle}`} />
                <Detail label="Salario base" value={formatRhCurrency(item.salario_base)} />
                <Detail label="Horas extras" value={formatRhCurrency(item.horas_extras)} />
                <Detail label="Descontos por falta" value={formatRhCurrency(item.descontos_falta)} />
                <Detail label="Acrescimos manuais" value={formatRhCurrency(item.acrescimos_manuais)} />
                <Detail label="Descontos manuais" value={formatRhCurrency(item.descontos_manuais)} />
                <Detail label="Pagamento agendado" value={item.pagamento_agendado_titulo ?? "Nao vinculado"} />
                <Detail label="Versao de calculo" value={String(item.calculation_version ?? "Nao informada")} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Itens e calculo</CardTitle>
                <CardDescription>Proventos, descontos e informativos com origem, regra, versao e base de calculo.</CardDescription>
              </CardHeader>
              <CardContent>
                <HoleriteBreakdown
                  items={itensQuery.data ?? []}
                  snapshots={snapshots}
                  loading={itensQuery.isLoading}
                  onLoadSnapshot={(holeriteItem) => snapshotMutation.mutate({ itemId: holeriteItem.id })}
                />
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </PermissionGate>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
