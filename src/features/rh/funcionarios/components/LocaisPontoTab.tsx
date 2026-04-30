import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2, MapPin, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { rhService } from "@/services/rh.service";
import type { RhLocalPonto, RhLocalPontoCreateRequest } from "@/types/rh.types";
import { getApiErrorMessage } from "@/lib/utils";
import { PermissionGate } from "../../shared/components/PermissionGate";
import { RhEmptyState } from "../../shared/components/RhEmptyState";
import { RhTableSkeleton } from "../../shared/components/RhTableSkeleton";
import { useRhPermission } from "../../shared/hooks/useRhPermission";
import { rhQueryKeys } from "../../shared/utils/queryKeys";
import { LocalPontoDialog } from "./LocalPontoDialog";

export function LocaisPontoTab({ funcionarioId }: { funcionarioId: string }) {
  const { can } = useRhPermission();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<RhLocalPonto | null>(null);
  const [removeTarget, setRemoveTarget] = useState<RhLocalPonto | null>(null);
  const canManage = can("rh.ponto.manage_locations");

  const query = useQuery({
    queryKey: rhQueryKeys.funcionarios.locaisPonto(funcionarioId),
    queryFn: () => rhService.listLocaisPonto(funcionarioId),
    enabled: can("rh.ponto.view"),
    staleTime: 30_000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: rhQueryKeys.funcionarios.locaisPonto(funcionarioId) });
    queryClient.invalidateQueries({ queryKey: rhQueryKeys.funcionarios.detail(funcionarioId) });
    queryClient.invalidateQueries({ queryKey: [...rhQueryKeys.all, "ponto"] });
  };

  const saveMutation = useMutation({
    mutationFn: (data: RhLocalPontoCreateRequest) =>
      selected ? rhService.updateLocalPonto(selected.id, data) : rhService.createLocalPonto(funcionarioId, data),
    onSuccess: () => {
      invalidate();
      toast.success("Local permitido salvo.");
      setDialogOpen(false);
      setSelected(null);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const removeMutation = useMutation({
    mutationFn: (localId: string) => rhService.deleteLocalPonto(localId),
    onSuccess: () => {
      invalidate();
      toast.success("Local permitido removido.");
      setRemoveTarget(null);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const locais = query.data?.items ?? [];

  return (
    <PermissionGate permission="rh.ponto.view">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="size-5" />
                Locais permitidos
              </CardTitle>
              <CardDescription>Gerencie os locais aceitos para registros de ponto deste colaborador.</CardDescription>
            </div>
            {canManage ? (
              <Button onClick={() => { setSelected(null); setDialogOpen(true); }}>
                <Plus className="size-4" />
                Novo local
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {query.isLoading ? <RhTableSkeleton rows={3} /> : null}
          {!query.isLoading && !locais.length ? (
            <RhEmptyState
              title="Nenhum local permitido"
              description={canManage ? "Cadastre um local para validar registros de ponto por area." : "Ainda nao ha locais permitidos para este colaborador."}
            />
          ) : null}
          {locais.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {locais.map((local) => (
                <div key={local.id} className="rounded-md border p-4 transition-colors duration-200 hover:bg-muted/30">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{local.nome}</p>
                      <p className="text-sm text-muted-foreground">Raio de {local.raio_metros} metros</p>
                    </div>
                    {canManage ? (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setSelected(local); setDialogOpen(true); }}>
                          <Edit2 className="size-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setRemoveTarget(local)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <LocalPontoDialog
        open={dialogOpen}
        onOpenChange={(open) => { setDialogOpen(open); if (!open) setSelected(null); }}
        local={selected}
        loading={saveMutation.isPending}
        onSubmit={(data) => saveMutation.mutate(data)}
      />
      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title="Remover local permitido"
        description="Registros futuros deixam de usar este local como referencia."
        confirmLabel="Remover"
        variant="destructive"
        loading={removeMutation.isPending}
        onConfirm={() => removeTarget && removeMutation.mutate(removeTarget.id)}
      />
    </PermissionGate>
  );
}
