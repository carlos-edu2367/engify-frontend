import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Gift, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { rhService } from "@/services/rh.service";
import { getApiErrorMessage } from "@/lib/utils";
import { PermissionGate } from "../../shared/components/PermissionGate";
import { RhEmptyState } from "../../shared/components/RhEmptyState";
import { RhTableSkeleton } from "../../shared/components/RhTableSkeleton";
import { useRhPermission } from "../../shared/hooks/useRhPermission";
import { rhQueryKeys } from "../../shared/utils/queryKeys";

export function FuncionarioBeneficiosTab({ funcionarioId }: { funcionarioId: string }) {
  const { can } = useRhPermission();
  const queryClient = useQueryClient();
  const [selectedBeneficioId, setSelectedBeneficioId] = useState("");
  const [removeTarget, setRemoveTarget] = useState<{ beneficioId: string; nome: string } | null>(null);
  const canManage = can("rh.regras.create");

  const assignedQuery = useQuery({
    queryKey: rhQueryKeys.funcionarios.beneficios(funcionarioId),
    queryFn: () => rhService.listFuncionarioBeneficios(funcionarioId),
    enabled: can("rh.regras.view"),
  });

  const allBeneficiosQuery = useQuery({
    queryKey: rhQueryKeys.encargos.beneficios({ limit: 200 }),
    queryFn: () => rhService.listBeneficios({ limit: 200 }),
    enabled: canManage,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: rhQueryKeys.funcionarios.beneficios(funcionarioId) });
  };

  const assignMutation = useMutation({
    mutationFn: (beneficioId: string) => rhService.assignBeneficioFuncionario(beneficioId, funcionarioId),
    onSuccess: () => {
      invalidate();
      setSelectedBeneficioId("");
      toast.success("Beneficio atribuido.");
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const removeMutation = useMutation({
    mutationFn: (beneficioId: string) => rhService.removeBeneficioFuncionario(beneficioId, funcionarioId),
    onSuccess: () => {
      invalidate();
      setRemoveTarget(null);
      toast.success("Beneficio removido.");
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const assigned = assignedQuery.data?.items ?? [];
  const allBeneficios = allBeneficiosQuery.data?.items ?? [];

  const assignedIds = new Set(assigned.map((v: { beneficio_id: string }) => v.beneficio_id));
  const available = allBeneficios.filter(
    (b: { id: string; status?: string }) => !assignedIds.has(b.id) && b.status !== "inativo"
  );

  return (
    <PermissionGate permission="rh.regras.view">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Gift className="size-5" />
                Beneficios
              </CardTitle>
              <CardDescription>Beneficios ativos atribuidos a este colaborador.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {canManage && (
            <div className="flex gap-2">
              <Select value={selectedBeneficioId} onValueChange={setSelectedBeneficioId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar beneficio para adicionar" />
                </SelectTrigger>
                <SelectContent>
                  {available.length === 0 ? (
                    <SelectItem value="__none__" disabled>
                      Nenhum beneficio disponivel
                    </SelectItem>
                  ) : (
                    available.map((b: { id: string; nome: string; valor_dia: string }) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.nome} — R$ {Number(b.valor_dia ?? 0).toFixed(2)}/dia
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button
                disabled={!selectedBeneficioId || selectedBeneficioId === "__none__" || assignMutation.isPending}
                onClick={() => assignMutation.mutate(selectedBeneficioId)}
              >
                <Plus className="size-4" />
                Adicionar
              </Button>
            </div>
          )}

          {assignedQuery.isLoading ? <RhTableSkeleton rows={3} /> : null}

          {!assignedQuery.isLoading && assigned.length === 0 ? (
            <RhEmptyState
              title="Nenhum beneficio atribuido"
              description={
                canManage
                  ? "Selecione um beneficio acima para atribuir a este colaborador."
                  : "Este colaborador nao possui beneficios atribuidos."
              }
            />
          ) : null}

          {assigned.length > 0 ? (
            <div className="flex flex-col gap-2">
              {assigned.map((vinculo: { beneficio_id: string; id: string }) => {
                const beneficio = allBeneficios.find((b: { id: string }) => b.id === vinculo.beneficio_id);
                const nome = beneficio?.nome ?? vinculo.beneficio_id;
                const valor = beneficio ? `R$ ${Number(beneficio.valor_dia ?? 0).toFixed(2)}/dia` : "";
                return (
                  <div
                    key={vinculo.beneficio_id}
                    className="flex items-center justify-between rounded-md border px-4 py-3"
                  >
                    <div>
                      <p className="font-medium">{nome}</p>
                      {valor ? <p className="text-xs text-muted-foreground">{valor}</p> : null}
                    </div>
                    {canManage ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRemoveTarget({ beneficioId: vinculo.beneficio_id, nome })}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title="Remover beneficio"
        description={`O beneficio "${removeTarget?.nome}" sera removido deste colaborador.`}
        confirmLabel="Remover"
        variant="destructive"
        loading={removeMutation.isPending}
        onConfirm={() => removeTarget && removeMutation.mutate(removeTarget.beneficioId)}
      />
    </PermissionGate>
  );
}
