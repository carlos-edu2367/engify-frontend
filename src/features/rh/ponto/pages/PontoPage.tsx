import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertTriangle, Clock3, ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { RhFuncionarioListItem, RhRegistroPonto, RhStatusPonto } from "@/types/rh.types";
import { EmployeeSearchSelect } from "../../shared/components/EmployeeSearchSelect";
import { PermissionGate } from "../../shared/components/PermissionGate";
import { RhDataTable, type RhColumn } from "../../shared/components/RhDataTable";
import { RhMetricCard } from "../../shared/components/RhMetricCard";
import { RhPageHeader } from "../../shared/components/RhPageHeader";
import { RhStatusBadge } from "../../shared/components/RhStatusBadge";
import { employeeDisplay } from "../../shared/utils/display";
import { formatRhDate } from "../../shared/utils/formatters";
import { rhPaths } from "../../shared/utils/paths";
import { usePontoDiaDetalhe, usePontos } from "../hooks/usePontoOperacional";

const statusOptions: Array<{ value: RhStatusPonto | "all"; label: string }> = [
  { value: "all", label: "Todos os status" },
  { value: "validado", label: "Validado" },
  { value: "negado", label: "Negado" },
  { value: "inconsistente", label: "Inconsistente" },
  { value: "ajustado", label: "Ajustado" },
];

function dateStart(value?: string | null) {
  return value ? `${value}T00:00:00` : undefined;
}

function dateEnd(value?: string | null) {
  return value ? `${value}T23:59:59` : undefined;
}

export function PontoPage({ forcedStatus, title = "Ponto" }: { forcedStatus?: RhStatusPonto; title?: string }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selected, setSelected] = useState<RhRegistroPonto | null>(null);
  const [employee, setEmployee] = useState<RhFuncionarioListItem | null>(null);
  const page = Number(searchParams.get("page") ?? "1");
  const status = (forcedStatus ?? searchParams.get("status") ?? "all") as RhStatusPonto | "all";
  const start = searchParams.get("start") ?? "";
  const end = searchParams.get("end") ?? "";

  const filters = {
    page,
    limit: 20,
    funcionario_id: employee?.id,
    status: status === "all" ? undefined : status,
    start: dateStart(start),
    end: dateEnd(end),
  };
  const pontosQuery = usePontos(filters);
  const selectedDate = selected?.timestamp ? selected.timestamp.slice(0, 10) : null;
  const detalheQuery = usePontoDiaDetalhe(selected?.funcionario_id, selectedDate);
  const detalhe = detalheQuery.data;
  const rows = pontosQuery.data?.items ?? [];
  const totalInconsistentes = rows.filter((item) => item.status === "inconsistente").length;
  const totalNegados = rows.filter((item) => item.status === "negado").length;

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.set("page", "1");
    setSearchParams(next);
  };

  const columns = useMemo<Array<RhColumn<RhRegistroPonto>>>(
    () => [
      {
        key: "funcionario",
        header: "Funcionario",
        render: (item) => {
          const display = employeeDisplay(item);
          return (
            <div>
              <p className="font-medium">{display.title}</p>
              <p className="text-xs text-muted-foreground">{display.subtitle}</p>
            </div>
          );
        },
      },
      { key: "data", header: "Data", render: (item) => formatRhDate(item.timestamp) },
      { key: "tipo", header: "Tipo", render: (item) => (item.tipo === "entrada" ? "Entrada" : "Saida") },
      {
        key: "hora",
        header: "Horario",
        render: (item) => new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(item.timestamp)),
      },
      { key: "status", header: "Status", render: (item) => <RhStatusBadge status={item.status} /> },
      { key: "actions", header: "Detalhe", render: (item) => <Button variant="outline" size="sm" onClick={() => setSelected(item)}>Abrir</Button> },
    ],
    []
  );

  return (
    <PermissionGate permission="rh.ponto.view" showDeniedState>
      <div className="flex flex-col gap-6">
        <RhPageHeader
          title={title}
          description="Registros de ponto por periodo, status e funcionario."
          actions={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild><Link to={rhPaths.pontoInconsistencias}>Inconsistencias</Link></Button>
              <Button variant="outline" asChild><Link to={rhPaths.pontoAjustes}>Ajustes</Link></Button>
            </div>
          }
        />

        <div className="grid gap-3 md:grid-cols-3">
          <RhMetricCard title="Registros na pagina" value={rows.length} icon={<Clock3 className="size-5" />} />
          <RhMetricCard title="Inconsistencias na pagina" value={totalInconsistentes} icon={<AlertTriangle className="size-5" />} />
          <RhMetricCard title="Pontos negados na pagina" value={totalNegados} icon={<ListFilter className="size-5" />} />
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Registros</CardTitle>
            <CardDescription>Filtros ficam na URL para preservar a fila apos navegacao ou acoes.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-3 md:grid-cols-4">
              <EmployeeSearchSelect value={employee} onChange={(next) => { setEmployee(next); updateParam("funcionario_id", next?.id ?? ""); }} />
              <Input type="date" value={start} onChange={(event) => updateParam("start", event.target.value)} />
              <Input type="date" value={end} onChange={(event) => updateParam("end", event.target.value)} />
              <Select value={status} onValueChange={(value) => updateParam("status", value)} disabled={!!forcedStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{statusOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <RhDataTable
              items={rows}
              columns={columns}
              getRowKey={(item) => item.id}
              loading={pontosQuery.isLoading}
              error={pontosQuery.isError}
              emptyTitle="Nenhum registro encontrado"
              emptyDescription="Altere periodo, funcionario ou status para ampliar a busca."
              page={pontosQuery.data?.page ?? page}
              hasNext={pontosQuery.data?.has_next}
              onPageChange={(nextPage) => updateParam("page", String(nextPage))}
              onRetry={() => pontosQuery.refetch()}
            />
          </CardContent>
        </Card>

        <Sheet open={!!selected} onOpenChange={(open) => (!open ? setSelected(null) : undefined)}>
          <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
            <SheetHeader>
              <SheetTitle>Detalhe do ponto</SheetTitle>
              <SheetDescription>Linha operacional do registro selecionado.</SheetDescription>
            </SheetHeader>
            {selected ? (
              <div className="mt-6 space-y-4 text-sm">
                <Detail label="Funcionario" value={employeeDisplay(detalhe ?? selected).title} />
                <Detail label="Data" value={formatRhDate(selected.timestamp)} />
                <Detail label="Horario" value={new Date(selected.timestamp).toLocaleTimeString("pt-BR")} />
                <Detail label="Tipo" value={selected.tipo === "entrada" ? "Entrada" : "Saida"} />
                <Detail label="Status" value={<RhStatusBadge status={selected.status} />} />
                <Detail label="Local autorizado" value={detalhe?.local_autorizado_nome ?? selected.local_ponto_nome ?? (selected.fora_local_autorizado ? "Fora de local autorizado" : "Nao informado")} />
                <div className="rounded-md border p-3">
                  <p className="text-xs uppercase text-muted-foreground">Linha do tempo do dia</p>
                  <div className="mt-3 space-y-2">
                    {(detalhe?.registros ?? [selected]).map((registro) => (
                      <div key={registro.id} className="flex items-center justify-between rounded-md bg-muted/40 p-2">
                        <span>{registro.tipo === "entrada" ? "Entrada" : "Saida"}</span>
                        <span>{new Date(registro.timestamp).toLocaleTimeString("pt-BR")}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <Detail label="Ajustes relacionados" value={`${detalhe?.ajustes_relacionados?.length ?? 0}`} />
                <Detail label="Impacto estimado" value={detalhe?.impacto_estimado ? `HE ${detalhe.impacto_estimado.horas_extras ?? "0"} · Faltas ${detalhe.impacto_estimado.faltas ?? "0"}` : "Nao calculado"} />
                {detalheQuery.isError ? <p className="rounded-md border p-3 text-sm text-muted-foreground">Detalhe operacional indisponivel neste ambiente; exibindo dados da listagem.</p> : null}
              </div>
            ) : null}
          </SheetContent>
        </Sheet>
      </div>
    </PermissionGate>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}
