import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Gift } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { rhService } from "@/services/rh.service";
import type { RhBeneficio } from "@/types/rh.types";
import { PermissionGate } from "../../shared/components/PermissionGate";
import { RhDataTable, type RhColumn } from "../../shared/components/RhDataTable";
import { RhPageHeader } from "../../shared/components/RhPageHeader";
import { RhStatusBadge } from "../../shared/components/RhStatusBadge";
import { useDebouncedValue } from "../../shared/hooks/useDebouncedValue";
import { rhQueryKeys } from "../../shared/utils/queryKeys";

const columns: Array<RhColumn<RhBeneficio>> = [
  { key: "nome", header: "Beneficio", render: (item) => <div><p className="font-medium">{item.nome}</p><p className="text-xs text-muted-foreground">{item.descricao ?? "Sem descricao"}</p></div> },
  { key: "status", header: "Status", render: (item) => <RhStatusBadge status={item.status ?? "ativo"} /> },
];

export function BeneficiosPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const filters = { page, limit: 20, search: debouncedSearch || undefined };
  const query = useQuery({
    queryKey: rhQueryKeys.encargos.beneficios(filters),
    queryFn: () => rhService.listBeneficios(filters),
    retry: 1,
  });

  return (
    <PermissionGate permission="rh.regras.view" showDeniedState>
      <div className="flex flex-col gap-6">
        <RhPageHeader title="Beneficios" description="Beneficios retornados pelo contrato administrativo de RH." />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Gift className="size-5" /> Beneficios</CardTitle>
            <CardDescription>Quando o backend disponibilizar aplicabilidade, esta tela passa a exibir vinculos por funcionario.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar beneficio" />
            <RhDataTable
              items={query.data?.items ?? []}
              columns={columns}
              getRowKey={(item) => item.id}
              loading={query.isLoading}
              error={query.isError}
              emptyTitle="Nenhum beneficio encontrado"
              emptyDescription="Beneficios retornados pelo backend aparecem aqui."
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
