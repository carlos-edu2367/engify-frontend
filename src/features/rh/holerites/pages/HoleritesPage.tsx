import { useState } from "react";
import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { RhStatusHolerite } from "@/types/rh.types";
import { PermissionGate } from "../../shared/components/PermissionGate";
import { RhDataTable, type RhColumn } from "../../shared/components/RhDataTable";
import { RhMetricCard } from "../../shared/components/RhMetricCard";
import { RhPageHeader } from "../../shared/components/RhPageHeader";
import { RhStatusBadge } from "../../shared/components/RhStatusBadge";
import { formatCompetence, formatRhCurrency } from "../../shared/utils/formatters";
import { rhPaths } from "../../shared/utils/paths";
import { useCompetenceState } from "../../shared/hooks/useCompetenceState";
import { useFolha } from "../../folha/hooks/useFolha";
import type { RhHolerite } from "@/types/rh.types";

export function HoleritesPage() {
  const competence = useCompetenceState();
  const [month, setMonth] = useState(competence.month);
  const [year, setYear] = useState(competence.year);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<RhStatusHolerite | "all">("all");
  const query = useFolha({ page, limit: 20, mes: month, ano: year, status: status === "all" ? undefined : status });
  const rows = query.data?.items ?? [];

  const columns: Array<RhColumn<RhHolerite>> = [
    { key: "competencia", header: "Competencia", render: (item) => formatCompetence(item.mes_referencia, item.ano_referencia) },
    { key: "funcionario", header: "Funcionario", render: (item) => item.funcionario_id },
    { key: "bruto", header: "Salario base", render: (item) => formatRhCurrency(item.salario_base) },
    { key: "liquido", header: "Liquido", render: (item) => formatRhCurrency(item.valor_liquido) },
    { key: "status", header: "Status", render: (item) => <RhStatusBadge status={item.status} /> },
    { key: "actions", header: "Detalhe", render: (item) => <Button variant="outline" size="sm" asChild><Link to={rhPaths.holeriteDetail(item.id)}>Abrir</Link></Button> },
  ];

  return (
    <PermissionGate permission="rh.folha.view" showDeniedState>
      <div className="flex flex-col gap-6">
        <RhPageHeader title="Holerites" description="Consulta administrativa de holerites por competencia." />
        <RhMetricCard title="Holerites na pagina" value={rows.length} icon={<FileText className="size-5" />} />
        <Card>
          <CardHeader>
            <CardTitle>Lista</CardTitle>
            <CardDescription>Use a folha para gerar, ajustar e fechar holerites.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-3 md:grid-cols-3">
              <Input type="number" min={1} max={12} value={month} onChange={(event) => { setMonth(Number(event.target.value)); setPage(1); }} />
              <Input type="number" min={2020} max={2100} value={year} onChange={(event) => { setYear(Number(event.target.value)); setPage(1); }} />
              <Select value={status} onValueChange={(value) => { setStatus(value as RhStatusHolerite | "all"); setPage(1); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="fechado">Fechado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <RhDataTable
              items={rows}
              columns={columns}
              getRowKey={(item) => item.id}
              loading={query.isLoading}
              error={query.isError}
              emptyTitle="Nenhum holerite encontrado"
              emptyDescription="Gere a folha da competencia para criar holerites."
              page={query.data?.page ?? page}
              hasNext={query.data?.has_next}
              onPageChange={setPage}
              onRetry={() => query.refetch()}
            />
          </CardContent>
        </Card>
      </div>
    </PermissionGate>
  );
}
