import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Gavel, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { rhService } from "@/services/rh.service";
import type { RhRegraEncargo } from "@/types/rh.types";
import { getApiErrorMessage } from "@/lib/utils";
import { PermissionGate } from "../../shared/components/PermissionGate";
import { RhDataTable, type RhColumn } from "../../shared/components/RhDataTable";
import { RhPageHeader } from "../../shared/components/RhPageHeader";
import { RhStatusBadge } from "../../shared/components/RhStatusBadge";
import { useDebouncedValue } from "../../shared/hooks/useDebouncedValue";
import { useRhPermission } from "../../shared/hooks/useRhPermission";
import { formatRhDate } from "../../shared/utils/formatters";
import { rhPaths } from "../../shared/utils/paths";
import { rhQueryKeys } from "../../shared/utils/queryKeys";
import { RegraEncargoDialog } from "../components/RegraEncargoDialog";

const columns: Array<RhColumn<RhRegraEncargo>> = [
  { key: "nome", header: "Regra", render: (item) => <div><p className="font-medium">{item.nome}</p><p className="text-xs text-muted-foreground">{item.codigo}</p></div> },
  { key: "natureza", header: "Natureza", render: (item) => item.natureza },
  { key: "calculo", header: "Calculo", render: (item) => item.tipo_calculo },
  { key: "vigencia", header: "Vigencia", render: (item) => `${formatRhDate(item.vigencia_inicio)} ate ${formatRhDate(item.vigencia_fim)}` },
  { key: "status", header: "Status", render: (item) => <RhStatusBadge status={item.status} /> },
  { key: "actions", header: "Detalhe", render: (item) => <Button variant="outline" size="sm" asChild><Link to={`${rhPaths.configuracoesRegras}/${item.id}`}>Abrir</Link></Button> },
];

export function RegrasEncargosPage() {
  const { can } = useRhPermission();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search);
  const filters = { page, limit: 20, search: debouncedSearch || undefined, status: status === "all" ? undefined : status };
  const query = useQuery({
    queryKey: rhQueryKeys.encargos.regras(filters),
    queryFn: () => rhService.listRegrasEncargos(filters),
    retry: 1,
  });
  const createMutation = useMutation({
    mutationFn: rhService.createRegraEncargo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...rhQueryKeys.all, "encargos", "regras"] });
      toast.success("Regra criada.");
      setDialogOpen(false);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
  const canCreate = can("rh.regras.create");

  return (
    <PermissionGate permission="rh.regras.view" showDeniedState>
      <div className="flex flex-col gap-6">
        <RhPageHeader
          title="Regras de encargos"
          description="Configure regras de calculo, vigencia e aplicacao em folha."
          actions={canCreate ? (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" />
              Nova regra
            </Button>
          ) : null}
        />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Gavel className="size-5" /> Regras</CardTitle>
            <CardDescription>Acompanhe regras, vigencias e status usados nos calculos da folha.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-3 md:grid-cols-[1fr_220px]">
              <Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar por nome ou codigo" />
              <Select value={status} onValueChange={(value) => { setStatus(value); setPage(1); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <RhDataTable
              items={query.data?.items ?? []}
              columns={columns}
              getRowKey={(item) => item.id}
              loading={query.isLoading}
              error={query.isError}
              emptyTitle="Nenhuma regra encontrada"
              emptyDescription="Cadastre regras para organizar calculos e vigencias da folha."
              page={query.data?.page ?? page}
              hasNext={query.data?.has_next}
              onPageChange={setPage}
              onRetry={() => query.refetch()}
            />
          </CardContent>
        </Card>
        <RegraEncargoDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          loading={createMutation.isPending}
          onSubmit={(data) => createMutation.mutate(data)}
        />
      </div>
    </PermissionGate>
  );
}
