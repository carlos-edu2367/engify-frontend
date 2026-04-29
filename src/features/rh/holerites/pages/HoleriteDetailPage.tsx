import { useParams } from "react-router-dom";
import { FileText, Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PermissionGate } from "../../shared/components/PermissionGate";
import { RhErrorState } from "../../shared/components/RhErrorState";
import { RhMetricCard } from "../../shared/components/RhMetricCard";
import { RhPageHeader } from "../../shared/components/RhPageHeader";
import { RhStatusBadge } from "../../shared/components/RhStatusBadge";
import { formatCompetence, formatRhCurrency } from "../../shared/utils/formatters";
import { useHoleriteDetail } from "../../folha/hooks/useFolha";

export function HoleriteDetailPage() {
  const { id } = useParams();
  const query = useHoleriteDetail(id);
  const item = query.data;

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
                <Detail label="Funcionario" value={item.funcionario_id} />
                <Detail label="Salario base" value={formatRhCurrency(item.salario_base)} />
                <Detail label="Horas extras" value={formatRhCurrency(item.horas_extras)} />
                <Detail label="Descontos por falta" value={formatRhCurrency(item.descontos_falta)} />
                <Detail label="Acrescimos manuais" value={formatRhCurrency(item.acrescimos_manuais)} />
                <Detail label="Descontos manuais" value={formatRhCurrency(item.descontos_manuais)} />
                <Detail label="Pagamento agendado" value={item.pagamento_agendado_id ?? "Nao vinculado"} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Snapshot e origem</CardTitle>
                <CardDescription>TODO(RH): o backend atual ainda nao retorna itens detalhados, regra/versao ou snapshot JSON do calculo. Esta pagina usa o contrato real de holerite disponivel.</CardDescription>
              </CardHeader>
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
