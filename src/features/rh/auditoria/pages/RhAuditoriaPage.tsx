import { useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { RhAuditLog } from "@/types/rh.types";
import { EntityPicker } from "../../shared/components/EntityPicker";
import { PermissionGate } from "../../shared/components/PermissionGate";
import { RhDataTable, type RhColumn } from "../../shared/components/RhDataTable";
import { RhMetricCard } from "../../shared/components/RhMetricCard";
import { RhPageHeader } from "../../shared/components/RhPageHeader";
import { formatRhDate } from "../../shared/utils/formatters";
import { humanizeAuditRecord } from "../../shared/utils/display";
import { useRhAuditoria } from "../hooks/useRhAuditoria";

const actionOptions = [
  { value: "all", label: "Todas as acoes" },
  { value: "created", label: "Criacao" },
  { value: "updated", label: "Atualizacao" },
  { value: "approved", label: "Aprovacao" },
  { value: "rejected", label: "Rejeicao" },
  { value: "closed", label: "Fechamento" },
  { value: "activated", label: "Ativacao" },
  { value: "inactivated", label: "Inativacao" },
];

export function RhAuditoriaPage() {
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState("");
  const [action, setAction] = useState("");
  const [actorSearch, setActorSearch] = useState("");
  const [selected, setSelected] = useState<RhAuditLog | null>(null);
  const query = useRhAuditoria({ page, limit: 20, entity_type: entityType || undefined, actor_search: actorSearch || undefined, action: action || undefined });
  const rows = query.data?.items ?? [];

  const columns = useMemo<Array<RhColumn<RhAuditLog>>>(
    () => [
      { key: "created", header: "Quando", render: (item) => formatRhDate(item.created_at) },
      { key: "action", header: "Acao", render: (item) => humanizeAction(item.action) },
      { key: "entity", header: "Entidade", render: (item) => item.entity_label ?? humanizeEntity(item.entity_type) },
      { key: "actor", header: "Ator", render: (item) => item.actor_nome ?? item.actor_role },
      { key: "reason", header: "Motivo", render: (item) => item.reason ?? "-" },
      { key: "detail", header: "Detalhe", render: (item) => <Button variant="outline" size="sm" onClick={() => setSelected(item)}>Abrir</Button> },
    ],
    []
  );

  return (
    <PermissionGate permission="rh.auditoria.view" showDeniedState>
      <div className="flex flex-col gap-6">
        <RhPageHeader title="Auditoria" description="Eventos pesquisaveis do RH com dados sensiveis mascarados." />
        <RhMetricCard title="Eventos na pagina" value={rows.length} icon={<ShieldCheck className="size-5" />} />
        <Card>
          <CardHeader>
            <CardTitle>Trilha de auditoria</CardTitle>
            <CardDescription>Filtros controlados reduzem erro operacional e evitam exposicao de identificadores tecnicos.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-3 md:grid-cols-3">
              <EntityPicker value={entityType} onChange={(value) => { setEntityType(value); setPage(1); }} />
              <Select value={action || "all"} onValueChange={(value) => { setAction(value === "all" ? "" : value); setPage(1); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{actionOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
              </Select>
              <Input value={actorSearch} onChange={(event) => { setActorSearch(event.target.value); setPage(1); }} placeholder="Buscar ator por nome" />
            </div>
            <RhDataTable
              items={rows}
              columns={columns}
              getRowKey={(item) => item.id}
              loading={query.isLoading}
              error={query.isError}
              emptyTitle="Nenhum evento encontrado"
              emptyDescription="Eventos aparecem apos acoes auditaveis no modulo de RH."
              page={query.data?.page ?? page}
              hasNext={query.data?.has_next}
              onPageChange={setPage}
              onRetry={() => query.refetch()}
            />
          </CardContent>
        </Card>
        <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
          <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
            <SheetHeader>
              <SheetTitle>Evento de auditoria</SheetTitle>
              <SheetDescription>{selected ? humanizeAction(selected.action) : null}</SheetDescription>
            </SheetHeader>
            {selected ? (
              <div className="mt-6 space-y-4 text-sm">
                <Detail label="Acao" value={humanizeAction(selected.action)} />
                <Detail label="Ator" value={selected.actor_nome ?? selected.actor_role} />
                <Detail label="Entidade" value={selected.entity_label ?? humanizeEntity(selected.entity_type)} />
                <Detail label="Motivo" value={selected.reason ?? "Nao informado"} />
                <AuditDiff title="Antes" values={humanizeAuditRecord(selected.before)} />
                <AuditDiff title="Depois" values={humanizeAuditRecord(selected.after)} />
                <details className="rounded-md border p-3">
                  <summary className="cursor-pointer font-medium">Secao tecnica restrita</summary>
                  <pre className="mt-3 max-h-64 overflow-auto rounded-md bg-muted/40 p-3 text-xs">
                    {JSON.stringify({ before: selected.before, after: selected.after }, null, 2)}
                  </pre>
                </details>
              </div>
            ) : null}
          </SheetContent>
        </Sheet>
      </div>
    </PermissionGate>
  );
}

function humanizeAction(action: string) {
  return action.replace(/^rh\./, "").replace(/\./g, " ");
}

function humanizeEntity(entity: string) {
  return entity.replace(/_/g, " ");
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function AuditDiff({ title, values }: { title: string; values: Array<{ label: string; value: string }> }) {
  return (
    <div className="rounded-md border p-3">
      <p className="font-medium">{title}</p>
      {values.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Sem dados exibiveis.</p> : null}
      <dl className="mt-2 space-y-2">
        {values.map((item) => (
          <div key={item.label} className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{item.label}</dt>
            <dd className="font-medium">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
