import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Calculator, LockKeyhole, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { RhHolerite, RhStatusHolerite } from "@/types/rh.types";
import { PermissionGate } from "../../shared/components/PermissionGate";
import { RhDataTable, type RhColumn } from "../../shared/components/RhDataTable";
import { RhMetricCard } from "../../shared/components/RhMetricCard";
import { RhPageHeader } from "../../shared/components/RhPageHeader";
import { RhStatusBadge } from "../../shared/components/RhStatusBadge";
import { formatCompetence, formatRhCurrency } from "../../shared/utils/formatters";
import { rhPaths } from "../../shared/utils/paths";
import { useCompetenceState } from "../../shared/hooks/useCompetenceState";
import { useFolha, useFolhaActions } from "../hooks/useFolha";

const statusOptions: Array<{ value: RhStatusHolerite | "all"; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "rascunho", label: "Rascunhos" },
  { value: "fechado", label: "Fechados" },
  { value: "cancelado", label: "Cancelados" },
];

export function FolhaPage({ fechamento = false }: { fechamento?: boolean }) {
  const params = useParams();
  const competence = useCompetenceState();
  const initialMonth = Number(params.mes ?? competence.month);
  const initialYear = Number(params.ano ?? competence.year);
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<RhStatusHolerite | "all">("all");
  const [funcionarioId, setFuncionarioId] = useState("");
  const [manualItem, setManualItem] = useState<RhHolerite | null>(null);
  const [closeOpen, setCloseOpen] = useState(fechamento);
  const [manualForm, setManualForm] = useState({ acrescimos_manuais: "", descontos_manuais: "", motivo: "" });
  const filters = { page, limit: 20, mes: month, ano: year, funcionario_id: funcionarioId || undefined, status: status === "all" ? undefined : status };
  const folhaQuery = useFolha(filters);
  const actions = useFolhaActions();
  const rows = folhaQuery.data?.items ?? [];
  const totalLiquido = rows.reduce((sum, item) => sum + Number(item.valor_liquido || 0), 0);

  const columns = useMemo<Array<RhColumn<RhHolerite>>>(
    () => [
      { key: "funcionario", header: "Funcionario", render: (item) => item.funcionario_id },
      { key: "salario", header: "Salario", render: (item) => formatRhCurrency(item.salario_base) },
      { key: "extras", header: "Horas extras", render: (item) => formatRhCurrency(item.horas_extras) },
      { key: "faltas", header: "Descontos falta", render: (item) => formatRhCurrency(item.descontos_falta) },
      { key: "liquido", header: "Liquido", render: (item) => formatRhCurrency(item.valor_liquido) },
      { key: "status", header: "Status", render: (item) => <RhStatusBadge status={item.status} /> },
      {
        key: "actions",
        header: "Acoes",
        render: (item) => (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={rhPaths.holeriteDetail(item.id)}>Detalhe</Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={item.status !== "rascunho"}
              onClick={() => {
                setManualItem(item);
                setManualForm({
                  acrescimos_manuais: String(item.acrescimos_manuais),
                  descontos_manuais: String(item.descontos_manuais),
                  motivo: "",
                });
              }}
            >
              Ajustes
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <PermissionGate permission="rh.folha.view" showDeniedState>
      <div className="flex flex-col gap-6">
        <RhPageHeader
          title={fechamento ? "Fechamento de folha" : "Folha"}
          description={`Competencia ${formatCompetence(month, year)} com rascunhos, divergencias e fechamento seguro.`}
          actions={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => actions.generate.mutate({ mes: month, ano: year, funcionario_id: funcionarioId || undefined })} disabled={actions.generate.isPending}>
                <Calculator className="size-4" />
                {actions.generate.isPending ? "Gerando..." : "Gerar rascunho"}
              </Button>
              <Button onClick={() => setCloseOpen(true)}>
                <LockKeyhole className="size-4" />
                Fechar folha
              </Button>
            </div>
          }
        />
        <div className="grid gap-3 md:grid-cols-3">
          <RhMetricCard title="Holerites na pagina" value={rows.length} icon={<Wallet className="size-5" />} />
          <RhMetricCard title="Rascunhos" value={rows.filter((item) => item.status === "rascunho").length} icon={<Calculator className="size-5" />} />
          <RhMetricCard title="Liquido na pagina" value={formatRhCurrency(totalLiquido)} icon={<LockKeyhole className="size-5" />} />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Competencia</CardTitle>
            <CardDescription>O fechamento gera pagamentos operacionais no financeiro pelo endpoint real `/rh/folha/fechar`.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-3 md:grid-cols-5">
              <Input type="number" min={1} max={12} value={month} onChange={(event) => { setMonth(Number(event.target.value)); setPage(1); }} />
              <Input type="number" min={2020} max={2100} value={year} onChange={(event) => { setYear(Number(event.target.value)); setPage(1); }} />
              <Input className="md:col-span-2" value={funcionarioId} onChange={(event) => { setFuncionarioId(event.target.value); setPage(1); }} placeholder="ID do funcionario" />
              <Select value={status} onValueChange={(value) => { setStatus(value as RhStatusHolerite | "all"); setPage(1); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{statusOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <RhDataTable
              items={rows}
              columns={columns}
              getRowKey={(item) => item.id}
              loading={folhaQuery.isLoading}
              error={folhaQuery.isError}
              emptyTitle="Nenhum holerite na competencia"
              emptyDescription="Gere rascunhos para revisar valores antes do fechamento."
              page={folhaQuery.data?.page ?? page}
              hasNext={folhaQuery.data?.has_next}
              onPageChange={setPage}
              onRetry={() => folhaQuery.refetch()}
            />
          </CardContent>
        </Card>
        <Dialog open={!!manualItem} onOpenChange={(open) => !open && setManualItem(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajustes manuais</DialogTitle>
              <DialogDescription>Disponivel apenas em rascunho e sempre com motivo auditavel.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 md:grid-cols-2">
              <Input value={manualForm.acrescimos_manuais} onChange={(event) => setManualForm((current) => ({ ...current, acrescimos_manuais: event.target.value }))} placeholder="Acrescimos" />
              <Input value={manualForm.descontos_manuais} onChange={(event) => setManualForm((current) => ({ ...current, descontos_manuais: event.target.value }))} placeholder="Descontos" />
              <Textarea className="md:col-span-2" rows={4} value={manualForm.motivo} onChange={(event) => setManualForm((current) => ({ ...current, motivo: event.target.value }))} placeholder="Motivo" />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setManualItem(null)}>Cancelar</Button>
              <Button
                disabled={!manualForm.motivo.trim() || actions.updateAjustes.isPending}
                onClick={() => manualItem && actions.updateAjustes.mutate({ id: manualItem.id, data: manualForm }, { onSuccess: () => setManualItem(null) })}
              >
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={closeOpen} onOpenChange={setCloseOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Fechar folha</DialogTitle>
              <DialogDescription>Revise antes de confirmar. Holerites fechados ficam congelados e geram pagamento operacional.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 rounded-md border p-3 text-sm">
              <p>Competencia: {formatCompetence(month, year)}</p>
              <p>Holerites na pagina: {rows.length}</p>
              <p>Total liquido visivel: {formatRhCurrency(totalLiquido)}</p>
              <p className="text-muted-foreground">O backend garante idempotencia pela chave enviada no service.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCloseOpen(false)}>Voltar</Button>
              <Button disabled={actions.close.isPending} onClick={() => actions.close.mutate({ mes: month, ano: year, funcionario_ids: funcionarioId ? [funcionarioId] : undefined }, { onSuccess: () => setCloseOpen(false) })}>
                {actions.close.isPending ? "Fechando..." : "Confirmar fechamento"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGate>
  );
}
