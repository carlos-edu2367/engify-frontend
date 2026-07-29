import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock3, HelpCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { RhAjustePonto, RhFuncionarioListItem, RhPontoDiaDetalhe, RhStatusAjuste } from "@/types/rh.types";
import { EmployeeSearchSelect } from "../../shared/components/EmployeeSearchSelect";
import { PermissionGate } from "../../shared/components/PermissionGate";
import { RhDataTable, type RhColumn } from "../../shared/components/RhDataTable";
import { RhMetricCard } from "../../shared/components/RhMetricCard";
import { RhPageHeader } from "../../shared/components/RhPageHeader";
import { RhStatusBadge } from "../../shared/components/RhStatusBadge";
import { employeeDisplay } from "../../shared/utils/display";
import { formatRhDate } from "../../shared/utils/formatters";
import { classifyDayPunches, intervalRoles, punchRoleLabel, type PunchRole } from "../../shared/utils/punchClassification";
import { useAjustePontoActions, useAjustesPonto, usePontoDiaDetalhe } from "../hooks/usePontoOperacional";

const statusOptions: Array<{ value: RhStatusAjuste | "all"; label: string }> = [
  { value: "pendente", label: "Pendentes" },
  { value: "all", label: "Todos" },
  { value: "aprovado", label: "Aprovados" },
  { value: "rejeitado", label: "Rejeitados" },
];

type Decision = { item: RhAjustePonto; mode: "approve" | "reject" };

export function AjustesPontoPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<RhStatusAjuste | "all">("pendente");
  const [employee, setEmployee] = useState<RhFuncionarioListItem | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [motivo, setMotivo] = useState("");
  const closeDialog = () => { setDecision(null); setMotivo(""); };
  const filters = {
    page,
    limit: 20,
    funcionario_id: employee?.id,
    status: status === "all" ? undefined : status,
  };
  const ajustesQuery = useAjustesPonto(filters);
  const actions = useAjustePontoActions();
  const rows = ajustesQuery.data?.items ?? [];
  const diaAtualQuery = usePontoDiaDetalhe(decision?.item.funcionario_id, decision?.item.data_referencia?.slice(0, 10));
  const diaAtual = diaAtualQuery.data;
  const dayRoles = classifyDayPunches(diaAtual?.registros ?? []);

  const columns = useMemo<Array<RhColumn<RhAjustePonto>>>(
    () => [
      { key: "funcionario", header: "Solicitante", render: (item) => {
        const display = employeeDisplay(item);
        return <div className="min-w-[220px]"><p className="font-medium">{display.title}</p><p className="text-xs text-muted-foreground">{display.subtitle}</p></div>;
      } },
      { key: "data", header: "Dia", render: (item) => formatRhDate(item.data_referencia) },
      { key: "entrada", header: "Entrada", render: (item) => item.hora_entrada_solicitada ? new Date(item.hora_entrada_solicitada).toLocaleTimeString("pt-BR") : "-" },
      { key: "intervalo", header: "Intervalo", render: (item) =>
        item.hora_intervalo_inicio_solicitada && item.hora_intervalo_fim_solicitada
          ? `${new Date(item.hora_intervalo_inicio_solicitada).toLocaleTimeString("pt-BR")} - ${new Date(item.hora_intervalo_fim_solicitada).toLocaleTimeString("pt-BR")}`
          : "-",
      },
      { key: "saida", header: "Saída", render: (item) => item.hora_saida_solicitada ? new Date(item.hora_saida_solicitada).toLocaleTimeString("pt-BR") : "-" },
      { key: "status", header: "Status", render: (item) => <RhStatusBadge status={item.status} /> },
      {
        key: "actions",
        header: "Ações",
        className: "sticky right-0 bg-background px-4 py-3 align-middle",
        render: (item) => (
          <div className="flex min-w-[172px] flex-wrap justify-end gap-2">
            <Button size="sm" disabled={item.status !== "pendente" || actions.approve.isPending} onClick={() => setDecision({ item, mode: "approve" })}>
              Aprovar
            </Button>
            <Button size="sm" variant="destructive" disabled={item.status !== "pendente"} onClick={() => setDecision({ item, mode: "reject" })}>
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
        <RhPageHeader
          title="Ajustes de ponto"
          description="Fila de decisão para correção de entradas e saídas solicitadas."
          actions={(
            <Button type="button" variant="outline" onClick={() => setHelpOpen(true)}>
              <HelpCircle className="mr-2 size-4" />
              Como analisar?
            </Button>
          )}
        />
        <div className="grid gap-3 md:grid-cols-3">
          <RhMetricCard title="Pendentes nesta fila" value={rows.filter((item) => item.status === "pendente").length} icon={<Clock3 className="size-5" />} />
          <RhMetricCard title="Aprovados na página" value={rows.filter((item) => item.status === "aprovado").length} icon={<CheckCircle2 className="size-5" />} />
          <RhMetricCard title="Rejeitados na página" value={rows.filter((item) => item.status === "rejeitado").length} icon={<XCircle className="size-5" />} />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Solicitações para analisar</CardTitle>
            <CardDescription>Use o filtro de pendentes para ver somente as solicitações que ainda precisam de ação.</CardDescription>
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
        <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Como analisar uma solicitação?</DialogTitle>
              <DialogDescription>
                Siga este passo a passo antes de aprovar ou rejeitar um ajuste de ponto.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <ol className="list-decimal space-y-2 pl-5">
                <li>Confira o nome do funcionário e o dia solicitado.</li>
                <li>Compare o que foi registrado com o que o funcionário pediu.</li>
                <li>Leia a justificativa antes de decidir.</li>
                <li>Aprove quando a correção fizer sentido.</li>
                <li>Rejeite somente quando houver motivo e escreva uma explicação clara.</li>
              </ol>
              <div className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
                Ao aprovar, o ponto deste dia será atualizado e a alteração pode aparecer na folha que ainda está em rascunho.
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => setHelpOpen(false)}>Entendi</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={!!decision} onOpenChange={(open) => !open && closeDialog()}>
          <DialogContent>
            {decision ? (
            decision.mode === "reject" ? (
              <>
                <DialogHeader>
                  <DialogTitle>Rejeitar ajuste</DialogTitle>
                  <DialogDescription>Revise as informações abaixo e explique com clareza por que a correção não pode ser aprovada.</DialogDescription>
                </DialogHeader>
                <AjusteComparativo
                  item={decision.item}
                  diaAtual={diaAtual}
                  dayRoles={dayRoles}
                  loading={diaAtualQuery.isLoading}
                  mode={decision.mode}
                />
                <Textarea value={motivo} onChange={(event) => setMotivo(event.target.value)} rows={4} placeholder="Explique por que o ajuste não pode ser aprovado." />
                <DialogFooter>
                  <Button variant="outline" onClick={closeDialog} disabled={actions.reject.isPending}>Cancelar</Button>
                  <Button
                    variant="destructive"
                    disabled={!motivo.trim() || actions.reject.isPending}
                    onClick={() => decision && actions.reject.mutate({ id: decision.item.id, motivo }, { onSuccess: closeDialog })}
                  >
                    {actions.reject.isPending ? "Rejeitando..." : "Rejeitar"}
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Aprovar ajuste</DialogTitle>
                  <DialogDescription>Revise as informações abaixo antes de confirmar a alteração deste dia.</DialogDescription>
                </DialogHeader>
                <AjusteComparativo
                  item={decision.item}
                  diaAtual={diaAtual}
                  dayRoles={dayRoles}
                  loading={diaAtualQuery.isLoading}
                  mode={decision.mode}
                />
                <DialogFooter>
                  <Button variant="outline" onClick={closeDialog} disabled={actions.approve.isPending}>Cancelar</Button>
                  <Button
                    disabled={actions.approve.isPending}
                    onClick={() => decision && actions.approve.mutate(decision.item.id, { onSuccess: closeDialog })}
                  >
                    {actions.approve.isPending ? "Aprovando..." : "Aprovar"}
                  </Button>
                </DialogFooter>
              </>
            )
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGate>
  );
}

function AjusteComparativo({
  item,
  diaAtual,
  dayRoles,
  loading,
  mode,
}: {
  item: RhAjustePonto;
  diaAtual?: RhPontoDiaDetalhe;
  dayRoles: Map<string, PunchRole>;
  loading: boolean;
  mode: Decision["mode"];
}) {
  const display = employeeDisplay(item);
  const solicitado: Array<{ label: string; value?: string | null }> = [
    { label: "Entrada", value: item.hora_entrada_solicitada },
    { label: "Saida p/ intervalo", value: item.hora_intervalo_inicio_solicitada },
    { label: "Volta do intervalo", value: item.hora_intervalo_fim_solicitada },
    { label: "Saida", value: item.hora_saida_solicitada },
  ].filter((row) => row.value);

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="rounded-md border p-3">
        <p className="text-xs uppercase text-muted-foreground">Registrado no ponto</p>
        {loading ? (
          <p className="mt-2 text-sm text-muted-foreground">Carregando...</p>
        ) : !diaAtual || diaAtual.registros.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Nenhum registro neste dia.</p>
        ) : (
          <div className="mt-2 space-y-1.5">
            {diaAtual.registros.map((registro) => {
              const role = dayRoles.get(registro.id) ?? "neutro";
              const label = role !== "neutro" ? punchRoleLabel[role] : registro.tipo === "entrada" ? "Entrada" : "Saída";
              return (
                <div key={registro.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2">
                    {label}
                    {intervalRoles.has(role) ? <Badge variant="secondary">Intervalo</Badge> : null}
                  </span>
                  <span>{new Date(registro.timestamp).toLocaleTimeString("pt-BR")}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="rounded-md border p-3">
        <p className="text-xs uppercase text-muted-foreground">Solicitado pelo funcionário</p>
        {solicitado.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Nenhum horário solicitado.</p>
        ) : (
          <div className="mt-2 space-y-1.5">
            {solicitado.map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-2 text-sm">
                <span>{row.label}</span>
                <span>{new Date(row.value as string).toLocaleTimeString("pt-BR")}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="rounded-md border p-3">
        <p className="text-xs uppercase text-muted-foreground">Justificativa</p>
        <div className="mt-2 space-y-2 text-sm">
          <div>
            <p className="font-medium">{display.title}</p>
            <p className="text-muted-foreground">{formatRhDate(item.data_referencia)}</p>
          </div>
          <p>{item.justificativa?.trim() || "Sem justificativa informada."}</p>
        </div>
      </div>
      <div className="rounded-md border p-3">
        <p className="text-xs uppercase text-muted-foreground">O que muda</p>
        {loading ? (
          <p className="mt-2 text-sm text-muted-foreground">Carregando...</p>
        ) : diaAtual?.impacto_estimado ? (
          <div className="mt-2 space-y-2 text-sm">
            <p>{mode === "approve" ? "O horário solicitado será incluído no ponto deste dia." : "A solicitação continuará sem alterar o ponto deste dia."}</p>
            <p>
              HE {diaAtual.impacto_estimado.horas_extras ?? "0.00"} h · Faltantes {diaAtual.impacto_estimado.horas_faltantes ?? "0.00"} h
              {diaAtual.impacto_estimado.incompleto ? " · Dia incompleto" : ""}
            </p>
          </div>
        ) : (
          <div className="mt-2 space-y-2 text-sm">
            <p>{mode === "approve" ? "O horário solicitado será incluído no ponto deste dia." : "A solicitação continuará sem alterar o ponto deste dia."}</p>
            <p className="text-muted-foreground">Impacto estimado não calculado.</p>
          </div>
        )}
      </div>
    </div>
  );
}
