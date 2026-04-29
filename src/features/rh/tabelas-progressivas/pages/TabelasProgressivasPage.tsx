import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Table2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { rhService } from "@/services/rh.service";
import type { RhTabelaProgressiva } from "@/types/rh.types";
import { PermissionGate } from "../../shared/components/PermissionGate";
import { RhDataTable, type RhColumn } from "../../shared/components/RhDataTable";
import { RhPageHeader } from "../../shared/components/RhPageHeader";
import { RhStatusBadge } from "../../shared/components/RhStatusBadge";
import { useDebouncedValue } from "../../shared/hooks/useDebouncedValue";
import { formatRhDate } from "../../shared/utils/formatters";
import { rhQueryKeys } from "../../shared/utils/queryKeys";

const columns: Array<RhColumn<RhTabelaProgressiva>> = [
  { key: "nome", header: "Tabela", render: (item) => <div><p className="font-medium">{item.nome}</p><p className="text-xs text-muted-foreground">{item.codigo}</p></div> },
  { key: "vigencia", header: "Vigencia", render: (item) => `${formatRhDate(item.vigencia_inicio)} ate ${formatRhDate(item.vigencia_fim)}` },
  { key: "faixas", header: "Faixas", render: (item) => String(item.faixas?.length ?? 0) },
  { key: "status", header: "Status", render: (item) => <RhStatusBadge status={item.status} /> },
];

export function TabelasProgressivasPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const filters = { page, limit: 20, search: debouncedSearch || undefined };
  const query = useQuery({
    queryKey: rhQueryKeys.encargos.tabelas(filters),
    queryFn: () => rhService.listTabelasProgressivas(filters),
    retry: 1,
  });

  return (
    <PermissionGate permission="rh.regras.view" showDeniedState>
      <div className="flex flex-col gap-6">
        <RhPageHeader title="Tabelas progressivas" description="Faixas de calculo versionadas para regras de encargos." />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Table2 className="size-5" /> Tabelas</CardTitle>
            <CardDescription>Faixas sao carregadas sob demanda quando retornadas pelo backend.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar tabela" />
            <RhDataTable
              items={query.data?.items ?? []}
              columns={columns}
              getRowKey={(item) => item.id}
              loading={query.isLoading}
              error={query.isError}
              emptyTitle="Nenhuma tabela encontrada"
              emptyDescription="Tabelas progressivas retornadas pelo backend aparecem aqui."
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
