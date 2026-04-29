import { useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { RhFerias, RhStatusFerias } from "@/types/rh.types";
import { PermissionGate } from "../../shared/components/PermissionGate";
import { RhDataTable, type RhColumn } from "../../shared/components/RhDataTable";
import { RhMetricCard } from "../../shared/components/RhMetricCard";
import { RhPageHeader } from "../../shared/components/RhPageHeader";
import { RhStatusBadge } from "../../shared/components/RhStatusBadge";
import { formatRhDate } from "../../shared/utils/formatters";
import { useFerias, useFeriasActions } from "../hooks/useFeriasOperacionais";

const statusOptions: Array<{ value: RhStatusFerias | "all"; label: string }> = [
  { value: "solicitado", label: "Solicitadas" },
  { value: "all", label: "Todas" },
  { value: "aprovado", label: "Aprovadas" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "concluido", label: "Concluidas" },
  { value: "cancelado", label: "Canceladas" },
  { value: "rejeitado", label: "Rejeitadas" },
];

type ReasonAction = { kind: "reject" | "cancel"; item: RhFerias };

export function FeriasPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<RhStatusFerias | "all">("solicitado");
  const [funcionarioId, setFuncionarioId] = useState("");
  const [reasonAction, setReasonAction] = useState<ReasonAction | null>(null);
  const [motivo, setMotivo] = useState("");
  const filters = { page, limit: 20, funcionario_id: funcionarioId || undefined, status: status === "all" ? undefined : status };
  const feriasQuery = useFerias(filters);
  const actions = useFeriasActions();
  const rows = feriasQuery.data?.items ?? [];

  const columns = useMemo<Array<RhColumn<RhFerias>>>(
    () => [
      { key: "funcionario", header: "Funcionario", render: (item) => item.funcionario_id },
      { key: "inicio", header: "Inicio", render: (item) => formatRhDate(item.data_inicio) },
      { key: "fim", header: "Fim", render: (item) => formatRhDate(item.data_fim) },
      { key: "status", header: "Status", render: (item) => <RhStatusBadge status={item.status} /> },
      { key: "motivo", header: "Motivo", render: (item) => item.motivo_rejeicao ?? "-" },
      {
        key: "actions",
        header: "Acoes",
        render: (item) => (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={item.status !== "solicitado" || actions.approve.isPending} onClick={() => actions.approve.mutate(item.id)}>
              Aprovar
            </Button>
            <Button size="sm" variant="destructive" disabled={item.status !== "solicitado"} onClick={() => setReasonAction({ kind: "reject", item })}>
              Rejeitar
            </Button>
            <Button size="sm" variant="outline" disabled={!["aprovado", "em_andamento"].includes(item.status)} onClick={() => setReasonAction({ kind: "cancel", item })}>
              Cancelar
            </Button>
          </div>
        ),
      },
    ],
    [actions.approve]
  );

  const confirmReason = () => {
    if (!reasonAction || !motivo.trim()) return;
    const mutation = reasonAction.kind === "reject" ? actions.reject : actions.cancel;
    mutation.mutate(
      { id: reasonAction.item.id, motivo },
      {
        onSuccess: () => {
          setReasonAction(null);
          setMotivo("");
        },
      }
    );
  };

  return (
    <PermissionGate permission="rh.ferias.view" showDeniedState>
      <div className="flex flex-col gap-6">
        <RhPageHeader title="Ferias" description="Solicitacoes, calendario operacional e impacto previsto na competencia." />
        <div className="grid gap-3 md:grid-cols-3">
          <RhMetricCard title="Na pagina" value={rows.length} icon={<CalendarDays className="size-5" />} />
          <RhMetricCard title="Aguardando aprovacao" value={rows.filter((item) => item.status === "solicitado").length} icon={<CheckCircle2 className="size-5" />} />
          <RhMetricCard title="Conflitos a revisar" value={rows.filter((item) => ["cancelado", "rejeitado"].includes(item.status)).length} icon={<XCircle className="size-5" />} />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Solicitacoes</CardTitle>
            <CardDescription>Aprovacao remove faltas previstas do periodo e pode exigir recalculo de folha em rascunho.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-3 md:grid-cols-[1fr_220px]">
              <Input value={funcionarioId} onChange={(event) => { setFuncionarioId(event.target.value); setPage(1); }} placeholder="ID do funcionario" />
              <Select value={status} onValueChange={(value) => { setStatus(value as RhStatusFerias | "all"); setPage(1); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{statusOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <RhDataTable
              items={rows}
              columns={columns}
              getRowKey={(item) => item.id}
              loading={feriasQuery.isLoading}
              error={feriasQuery.isError}
              emptyTitle="Nenhuma solicitacao de ferias"
              emptyDescription="Quando houver pedidos ou historico no periodo, eles aparecem aqui."
              page={feriasQuery.data?.page ?? page}
              hasNext={feriasQuery.data?.has_next}
              onPageChange={setPage}
              onRetry={() => feriasQuery.refetch()}
            />
          </CardContent>
        </Card>
        <Dialog open={!!reasonAction} onOpenChange={(open) => !open && setReasonAction(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{reasonAction?.kind === "cancel" ? "Cancelar ferias" : "Rejeitar ferias"}</DialogTitle>
              <DialogDescription>O motivo fica registrado para auditoria e para o solicitante.</DialogDescription>
            </DialogHeader>
            <Textarea value={motivo} onChange={(event) => setMotivo(event.target.value)} rows={4} placeholder="Motivo" />
            <DialogFooter>
              <Button variant="outline" onClick={() => setReasonAction(null)}>Voltar</Button>
              <Button variant="destructive" disabled={!motivo.trim() || actions.reject.isPending || actions.cancel.isPending} onClick={confirmReason}>
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGate>
  );
}
