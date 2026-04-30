import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2, Gift, Plus, Power } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { rhService } from "@/services/rh.service";
import type { RhBeneficio } from "@/types/rh.types";
import { getApiErrorMessage } from "@/lib/utils";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PermissionGate } from "../../shared/components/PermissionGate";
import { RhDataTable, type RhColumn } from "../../shared/components/RhDataTable";
import { RhPageHeader } from "../../shared/components/RhPageHeader";
import { RhStatusBadge } from "../../shared/components/RhStatusBadge";
import { useRhPermission } from "../../shared/hooks/useRhPermission";
import { useDebouncedValue } from "../../shared/hooks/useDebouncedValue";
import { rhQueryKeys } from "../../shared/utils/queryKeys";
import { BeneficioDialog } from "../components/BeneficioDialog";

export function BeneficiosPage() {
  const { can } = useRhPermission();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<RhBeneficio | null>(null);
  const [statusTarget, setStatusTarget] = useState<RhBeneficio | null>(null);
  const debouncedSearch = useDebouncedValue(search);
  const filters = { page, limit: 20, search: debouncedSearch || undefined };
  const query = useQuery({
    queryKey: rhQueryKeys.encargos.beneficios(filters),
    queryFn: () => rhService.listBeneficios(filters),
    retry: 1,
  });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: [...rhQueryKeys.all, "encargos", "beneficios"] });
  const saveMutation = useMutation({
    mutationFn: (data: { nome: string; descricao?: string | null; status?: string | null }) =>
      selected ? rhService.updateBeneficio(selected.id, data) : rhService.createBeneficio(data),
    onSuccess: () => {
      invalidate();
      toast.success("Beneficio salvo.");
      setDialogOpen(false);
      setSelected(null);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
  const statusMutation = useMutation({
    mutationFn: (beneficio: RhBeneficio) =>
      beneficio.status === "inativo" ? rhService.reactivateBeneficio(beneficio.id) : rhService.inactivateBeneficio(beneficio.id),
    onSuccess: () => {
      invalidate();
      toast.success("Status do beneficio atualizado.");
      setStatusTarget(null);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
  const canManage = can("rh.regras.create");
  const columns: Array<RhColumn<RhBeneficio>> = [
    { key: "nome", header: "Beneficio", render: (item) => <div><p className="font-medium">{item.nome}</p><p className="text-xs text-muted-foreground">{item.descricao ?? "Sem descricao"}</p></div> },
    { key: "status", header: "Status", render: (item) => <RhStatusBadge status={item.status ?? "ativo"} /> },
    {
      key: "actions",
      header: "Acoes",
      render: (item) => canManage ? (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setSelected(item); setDialogOpen(true); }}>
            <Edit2 className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setStatusTarget(item)}>
            <Power className="size-4" />
          </Button>
        </div>
      ) : "Disponivel",
    },
  ];

  return (
    <PermissionGate permission="rh.regras.view" showDeniedState>
      <div className="flex flex-col gap-6">
        <RhPageHeader
          title="Beneficios"
          description="Cadastre beneficios e acompanhe quais opcoes estao disponiveis para uso no RH."
          actions={canManage ? (
            <Button onClick={() => { setSelected(null); setDialogOpen(true); }}>
              <Plus className="size-4" />
              Novo beneficio
            </Button>
          ) : null}
        />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Gift className="size-5" /> Beneficios</CardTitle>
            <CardDescription>Organize os beneficios ativos e acompanhe a disponibilidade para os colaboradores.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar beneficio" />
            <RhDataTable
              items={query.data?.items ?? []}
              columns={columns}
              getRowKey={(item) => item.id}
              loading={query.isLoading}
              error={query.isError}
              emptyTitle={search ? "Nenhum beneficio encontrado" : "Nenhum beneficio cadastrado"}
              emptyDescription={canManage ? "Use Novo beneficio para disponibilizar opcoes ao RH." : "Ainda nao ha beneficios disponiveis para consulta."}
              page={query.data?.page ?? page}
              hasNext={query.data?.has_next}
              onPageChange={setPage}
              onRetry={() => query.refetch()}
            />
          </CardContent>
        </Card>
        <BeneficioDialog
          open={dialogOpen}
          onOpenChange={(open) => { setDialogOpen(open); if (!open) setSelected(null); }}
          beneficio={selected}
          loading={saveMutation.isPending}
          onSubmit={(data) => saveMutation.mutate(data)}
        />
        <ConfirmDialog
          open={!!statusTarget}
          onOpenChange={(open) => !open && setStatusTarget(null)}
          title={statusTarget?.status === "inativo" ? "Reativar beneficio" : "Inativar beneficio"}
          description="A lista sera atualizada para refletir o status escolhido."
          confirmLabel={statusTarget?.status === "inativo" ? "Reativar" : "Inativar"}
          loading={statusMutation.isPending}
          onConfirm={() => statusTarget && statusMutation.mutate(statusTarget)}
        />
      </div>
    </PermissionGate>
  );
}
