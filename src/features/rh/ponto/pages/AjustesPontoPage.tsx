import { useMemo, useState } from "react";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { RhAjustePonto, RhStatusAjuste } from "@/types/rh.types";
import { PermissionGate } from "../../shared/components/PermissionGate";
import { RhDataTable, type RhColumn } from "../../shared/components/RhDataTable";
import { RhMetricCard } from "../../shared/components/RhMetricCard";
import { RhPageHeader } from "../../shared/components/RhPageHeader";
import { RhStatusBadge } from "../../shared/components/RhStatusBadge";
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
  const [funcionarioId, setFuncionarioId] = useState("");
  const [reasonItem, setReasonItem] = useState<RhAjustePonto | null>(null);
  const [motivo, setMotivo] = useState("");
  const filters = {
    page,
    limit: 20,
    funcionario_id: funcionarioId || undefined,
    status: status === "all" ? undefined : status,
  };
  const ajustesQuery = useAjustesPonto(filters);
  const actions = useAjustePontoActions();
  const rows = ajustesQuery.data?.items ?? [];

  const columns = useMemo<Array<RhColumn<RhAjustePonto>>>(
    () => [
      { key: "funcionario", header: "Funcionario", render: (item) => item.funcionario_id },
      { key: "data", header: "Data", render: (item) => formatRhDate(item.data_referencia) },
      { key: "entrada", header: "Entrada solicitada", render: (item) => item.hora_entrada_solicitada ? new Date(item.hora_entrada_solicitada).toLocaleTimeString("pt-BR") : "-" },
      { key: "saida", header: "Saida solicitada", render: (item) => item.hora_saida_solicitada ? new Date(item.hora_saida_solicitada).toLocaleTimeString("pt-BR") : "-" },
      { key: "status", header: "Status", render: (item) => <RhStatusBadge status={item.status} /> },
      {
        key: "actions",
        header: "Acoes",
        render: (item) => (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={item.status !== "pendente" || actions.approve.isPending} onClick={() => actions.approve.mutate(item.id)}>
              Aprovar
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
              <Input value={funcionarioId} onChange={(event) => { setFuncionarioId(event.target.value); setPage(1); }} placeholder="ID do funcionario" />
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
              <DialogTitle>Rejeitar ajuste</DialogTitle>
              <DialogDescription>Informe o motivo que sera exibido no historico da solicitacao.</DialogDescription>
            </DialogHeader>
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
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGate>
  );
}
