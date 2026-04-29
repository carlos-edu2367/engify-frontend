import { useMemo, useState } from "react";
import { FileCheck2, FileClock, FileX2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { RhAtestado, RhFuncionarioListItem, RhStatusAtestado } from "@/types/rh.types";
import { EmployeeSearchSelect } from "../../shared/components/EmployeeSearchSelect";
import { RhImpactChecklist } from "../../shared/components/RhImpactChecklist";
import { PermissionGate } from "../../shared/components/PermissionGate";
import { RhDataTable, type RhColumn } from "../../shared/components/RhDataTable";
import { RhMetricCard } from "../../shared/components/RhMetricCard";
import { RhPageHeader } from "../../shared/components/RhPageHeader";
import { RhStatusBadge } from "../../shared/components/RhStatusBadge";
import { employeeDisplay, safeTipoAtestadoName } from "../../shared/utils/display";
import { formatRhDate } from "../../shared/utils/formatters";
import { useAtestadoActions, useAtestados } from "../hooks/useAtestadosOperacionais";

const statusOptions: Array<{ value: RhStatusAtestado | "all"; label: string }> = [
  { value: "aguardando_entrega", label: "Aguardando entrega" },
  { value: "all", label: "Todos" },
  { value: "entregue", label: "Entregues" },
  { value: "vencido", label: "Vencidos" },
  { value: "rejeitado", label: "Rejeitados" },
];

type DialogState = { kind: "deliver" | "reject"; item: RhAtestado };

export function AtestadosPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<RhStatusAtestado | "all">("aguardando_entrega");
  const [employee, setEmployee] = useState<RhFuncionarioListItem | null>(null);
  const [dialogState, setDialogState] = useState<DialogState | null>(null);
  const [motivo, setMotivo] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const filters = { page, limit: 20, funcionario_id: employee?.id, status: status === "all" ? undefined : status };
  const atestadosQuery = useAtestados(filters);
  const actions = useAtestadoActions();
  const rows = atestadosQuery.data?.items ?? [];

  const columns = useMemo<Array<RhColumn<RhAtestado>>>(
    () => [
      { key: "funcionario", header: "Funcionario", render: (item) => {
        const display = employeeDisplay(item);
        return <div><p className="font-medium">{display.title}</p><p className="text-xs text-muted-foreground">{display.subtitle}</p></div>;
      } },
      { key: "tipo", header: "Tipo", render: (item) => safeTipoAtestadoName(item) },
      { key: "periodo", header: "Periodo", render: (item) => `${formatRhDate(item.data_inicio)} ate ${formatRhDate(item.data_fim)}` },
      { key: "documento", header: "Documento", render: (item) => (item.has_file ? "Anexado" : "Pendente") },
      { key: "status", header: "Status", render: (item) => <RhStatusBadge status={item.status} /> },
      {
        key: "actions",
        header: "Acoes",
        render: (item) => (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={item.status !== "aguardando_entrega"} onClick={() => setDialogState({ kind: "deliver", item })}>
              Entregar
            </Button>
            <Button size="sm" variant="destructive" disabled={!["aguardando_entrega", "vencido"].includes(item.status)} onClick={() => setDialogState({ kind: "reject", item })}>
              Rejeitar
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const submitDialog = () => {
    if (!dialogState) return;
    if (dialogState.kind === "deliver") {
      if (!file) return;
      actions.deliver.mutate(
        { id: dialogState.item.id, file },
        { onSuccess: () => { setDialogState(null); setFile(null); setMotivo(""); } }
      );
      return;
    }
    actions.reject.mutate(
      { id: dialogState.item.id, motivo },
      { onSuccess: () => { setDialogState(null); setFile(null); setMotivo(""); } }
    );
  };

  return (
    <PermissionGate permission="rh.atestados.view" showDeniedState>
      <div className="flex flex-col gap-6">
        <RhPageHeader title="Atestados" description="Fila de documentos, prazos e impacto em faltas abonadas." />
        <div className="grid gap-3 md:grid-cols-3">
          <RhMetricCard title="Aguardando" value={rows.filter((item) => item.status === "aguardando_entrega").length} icon={<FileClock className="size-5" />} />
          <RhMetricCard title="Entregues" value={rows.filter((item) => item.status === "entregue").length} icon={<FileCheck2 className="size-5" />} />
          <RhMetricCard title="Vencidos/Rejeitados" value={rows.filter((item) => ["vencido", "rejeitado"].includes(item.status)).length} icon={<FileX2 className="size-5" />} />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Fila de atestados</CardTitle>
            <CardDescription>Rejeicao exige motivo e entrega usa upload controlado por URL assinada.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-3 md:grid-cols-[1fr_220px]">
              <EmployeeSearchSelect value={employee} onChange={(next) => { setEmployee(next); setPage(1); }} />
              <Select value={status} onValueChange={(value) => { setStatus(value as RhStatusAtestado | "all"); setPage(1); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{statusOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <RhDataTable
              items={rows}
              columns={columns}
              getRowKey={(item) => item.id}
              loading={atestadosQuery.isLoading}
              error={atestadosQuery.isError}
              emptyTitle="Nenhum atestado encontrado"
              emptyDescription="A fila fica vazia quando nao ha documentos no filtro atual."
              page={atestadosQuery.data?.page ?? page}
              hasNext={atestadosQuery.data?.has_next}
              onPageChange={setPage}
              onRetry={() => atestadosQuery.refetch()}
            />
          </CardContent>
        </Card>
        <Dialog open={!!dialogState} onOpenChange={(open) => !open && setDialogState(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dialogState?.kind === "deliver" ? "Entregar atestado" : "Rejeitar atestado"}</DialogTitle>
              <DialogDescription>{dialogState?.kind === "deliver" ? "Selecione o documento para envio direto ao storage." : "Informe o motivo para auditoria e retorno ao funcionario."}</DialogDescription>
            </DialogHeader>
            <RhImpactChecklist
              items={[
                { id: "folha", label: "Impacto em falta abonada revisado", description: "A decisao pode alterar a competencia da folha.", checked: true },
                { id: "funcionario", label: employeeDisplay(dialogState?.item).title, description: safeTipoAtestadoName(dialogState?.item), checked: true },
              ]}
              onToggle={() => undefined}
            />
            {dialogState?.kind === "deliver" ? (
              <Input type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
            ) : (
              <Textarea value={motivo} onChange={(event) => setMotivo(event.target.value)} rows={4} placeholder="Motivo" />
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogState(null)}>Cancelar</Button>
              <Button disabled={(dialogState?.kind === "deliver" ? !file : !motivo.trim()) || actions.deliver.isPending || actions.reject.isPending} onClick={submitDialog}>
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGate>
  );
}
