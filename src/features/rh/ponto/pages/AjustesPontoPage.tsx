import { useMemo, useState } from "react";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { RhAjustePonto, RhFuncionarioListItem, RhStatusAjuste } from "@/types/rh.types";
import { EmployeeSearchSelect } from "../../shared/components/EmployeeSearchSelect";
import { RhImpactChecklist } from "../../shared/components/RhImpactChecklist";
import { PermissionGate } from "../../shared/components/PermissionGate";
import { RhDataTable, type RhColumn } from "../../shared/components/RhDataTable";
import { RhMetricCard } from "../../shared/components/RhMetricCard";
import { RhPageHeader } from "../../shared/components/RhPageHeader";
import { RhStatusBadge } from "../../shared/components/RhStatusBadge";
import { employeeDisplay } from "../../shared/utils/display";
import { formatRhDate } from "../../shared/utils/formatters";
import { useAjustePontoActions, useAjustesPonto } from "../hooks/usePontoOperacional";

const statusOptions: Array<{ value: RhStatusAjuste | "all"; label: string }> = [
  { value: "pendente", label: "Pendentes" },
  { value: "all", label: "Todos" },
  { value: "aprovado", label: "Aprovados" },
  { value: "rejeitado", label: "Rejeitados" },
];

export function AjustesPontoPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<RhStatusAjuste | "all">("pendente");
  const [employee, setEmployee] = useState<RhFuncionarioListItem | null>(null);
  const [reasonItem, setReasonItem] = useState<RhAjustePonto | null>(null);
  const [motivo, setMotivo] = useState("");
  const filters = {
    page,
    limit: 20,
    funcionario_id: employee?.id,
    status: status === "all" ? undefined : status,
  };
  const ajustesQuery = useAjustesPonto(filters);
  const actions = useAjustePontoActions();
  const rows = ajustesQuery.data?.items ?? [];

  const columns = useMemo<Array<RhColumn<RhAjustePonto>>>(
    () => [
      { key: "funcionario", header: "Funcionario", render: (item) => {
        const display = employeeDisplay(item);
        return <div><p className="font-medium">{display.title}</p><p className="text-xs text-muted-foreground">{display.subtitle}</p></div>;
      } },
      { key: "data", header: "Data", render: (item) => formatRhDate(item.data_referencia) },
      { key: "entrada", header: "Entrada solicitada", render: (item) => item.hora_entrada_solicitada ? new Date(item.hora_entrada_solicitada).toLocaleTimeString("pt-BR") : "-" },
      { key: "saida", header: "Saida solicitada", render: (item) => item.hora_saida_solicitada ? new Date(item.hora_saida_solicitada).toLocaleTimeString("pt-BR") : "-" },
      { key: "status", header: "Status", render: (item) => <RhStatusBadge status={item.status} /> },
      {
        key: "actions",
        header: "Acoes",
        render: (item) => (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={item.status !== "pendente" || actions.approve.isPending} onClick={() => setReasonItem(item)}>
              Decidir
            </Button>
            <Button size="sm" variant="destructive" disabled={item.status !== "pendente"} onClick={() => setReasonItem(item)}>
              Rejeitar
            </Button>
          </div>
        ),
      },
    ],
    [actions.approve]
  );

  return (
    <PermissionGate permission="rh.ponto.approve_adjustment" showDeniedState>
      <div className="flex flex-col gap-6">
        <RhPageHeader title="Ajustes de ponto" description="Fila de decisao para correcao de entradas e saidas solicitadas." />
        <div className="grid gap-3 md:grid-cols-3">
          <RhMetricCard title="Na pagina" value={rows.length} icon={<Clock3 className="size-5" />} />
          <RhMetricCard title="Pendentes" value={rows.filter((item) => item.status === "pendente").length} icon={<CheckCircle2 className="size-5" />} />
          <RhMetricCard title="Rejeitados" value={rows.filter((item) => item.status === "rejeitado").length} icon={<XCircle className="size-5" />} />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Fila operacional</CardTitle>
            <CardDescription>Aprovacao marca o dia como ajustado e pode afetar folha em rascunho.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-3 md:grid-cols-[1fr_220px]">
              <EmployeeSearchSelect value={employee} onChange={(next) => { setEmployee(next); setPage(1); }} />
              <Select value={status} onValueChange={(value) => { setStatus(value as RhStatusAjuste | "all"); setPage(1); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <RhDataTable
              items={rows}
              columns={columns}
              getRowKey={(item) => item.id}
              loading={ajustesQuery.isLoading}
              error={ajustesQuery.isError}
              emptyTitle="Nenhum ajuste encontrado"
              emptyDescription="A fila fica vazia quando nao ha solicitacoes no filtro atual."
              page={ajustesQuery.data?.page ?? page}
              hasNext={ajustesQuery.data?.has_next}
              onPageChange={setPage}
              onRetry={() => ajustesQuery.refetch()}
            />
          </CardContent>
        </Card>
        <Dialog open={!!reasonItem} onOpenChange={(open) => !open && setReasonItem(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Decidir ajuste</DialogTitle>
              <DialogDescription>Revise o impacto antes de aprovar ou rejeitar. Motivo e obrigatorio para a decisao auditavel.</DialogDescription>
            </DialogHeader>
            <RhImpactChecklist
              items={[
                { id: "competencia", label: "Competencia impactada revisada", description: "Ajuste pode alterar horas extras ou faltas.", checked: true },
                { id: "funcionario", label: employeeDisplay(reasonItem ?? undefined).title, description: employeeDisplay(reasonItem ?? undefined).subtitle, checked: true },
              ]}
              onToggle={() => undefined}
            />
            <Textarea value={motivo} onChange={(event) => setMotivo(event.target.value)} rows={4} placeholder="Motivo da rejeicao" />
            <DialogFooter>
              <Button variant="outline" onClick={() => setReasonItem(null)} disabled={actions.reject.isPending}>Cancelar</Button>
              <Button
                variant="destructive"
                disabled={!motivo.trim() || actions.reject.isPending}
                onClick={() => reasonItem && actions.reject.mutate({ id: reasonItem.id, motivo }, { onSuccess: () => { setReasonItem(null); setMotivo(""); } })}
              >
                {actions.reject.isPending ? "Rejeitando..." : "Rejeitar"}
              </Button>
              <Button
                disabled={!motivo.trim() || actions.approve.isPending}
                onClick={() => reasonItem && actions.approve.mutate(reasonItem.id, { onSuccess: () => { setReasonItem(null); setMotivo(""); } })}
              >
                {actions.approve.isPending ? "Aprovando..." : "Aprovar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGate>
  );
}
