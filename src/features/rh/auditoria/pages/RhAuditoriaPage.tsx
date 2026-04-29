import { useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { RhAuditLog } from "@/types/rh.types";
import { PermissionGate } from "../../shared/components/PermissionGate";
import { RhDataTable, type RhColumn } from "../../shared/components/RhDataTable";
import { RhMetricCard } from "../../shared/components/RhMetricCard";
import { RhPageHeader } from "../../shared/components/RhPageHeader";
import { formatRhDate } from "../../shared/utils/formatters";
import { useRhAuditoria } from "../hooks/useRhAuditoria";

export function RhAuditoriaPage() {
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState("");
  const [action, setAction] = useState("");
  const [selected, setSelected] = useState<RhAuditLog | null>(null);
  const query = useRhAuditoria({ page, limit: 20, entity_type: entityType || undefined, action: action || undefined });
  const rows = query.data?.items ?? [];

  const columns = useMemo<Array<RhColumn<RhAuditLog>>>(
    () => [
      { key: "created", header: "Quando", render: (item) => formatRhDate(item.created_at) },
      { key: "action", header: "Acao", render: (item) => humanizeAction(item.action) },
      { key: "entity", header: "Entidade", render: (item) => `${item.entity_type}${item.entity_id ? ` / ${item.entity_id}` : ""}` },
      { key: "actor", header: "Ator", render: (item) => item.actor_user_id ?? item.actor_role },
      { key: "reason", header: "Motivo", render: (item) => item.reason ?? "-" },
      { key: "detail", header: "Detalhe", render: (item) => <Button variant="outline" size="sm" onClick={() => setSelected(item)}>Abrir</Button> },
    ],
    []
  );

  return (
    <PermissionGate permission="rh.auditoria.view" showDeniedState>
      <div className="flex flex-col gap-6">
        <RhPageHeader title="Auditoria" description="Eventos pesquisaveis do RH com dados sensiveis mascarados pelo backend." />
        <RhMetricCard title="Eventos na pagina" value={rows.length} icon={<ShieldCheck className="size-5" />} />
        <Card>
          <CardHeader>
            <CardTitle>Trilha de auditoria</CardTitle>
            <CardDescription>Use filtros especificos para investigar acoes criticas por entidade ou action.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              <Input value={entityType} onChange={(event) => { setEntityType(event.target.value); setPage(1); }} placeholder="entity_type, ex: holerite" />
              <Input value={action} onChange={(event) => { setAction(event.target.value); setPage(1); }} placeholder="action, ex: rh.holerite.closed" />
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
              <div className="mt-6 space-y-3 text-sm">
                <Detail label="Action" value={selected.action} />
                <Detail label="Ator" value={selected.actor_user_id ?? selected.actor_role} />
                <Detail label="Entidade" value={`${selected.entity_type}${selected.entity_id ? ` / ${selected.entity_id}` : ""}`} />
                <Detail label="Request ID" value={selected.request_id ?? "Nao informado"} />
                <Detail label="Motivo" value={selected.reason ?? "Nao informado"} />
                <pre className="max-h-64 overflow-auto rounded-md border bg-muted/40 p-3 text-xs">
                  {JSON.stringify({ before: selected.before, after: selected.after }, null, 2)}
                </pre>
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

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
