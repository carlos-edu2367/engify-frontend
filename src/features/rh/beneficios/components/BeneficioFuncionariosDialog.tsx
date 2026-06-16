import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { rhService } from "@/services/rh.service";
import type { RhBeneficio } from "@/types/rh.types";
import { getApiErrorMessage } from "@/lib/utils";

export function BeneficioFuncionariosDialog({
  beneficio,
  open,
  onOpenChange,
}: {
  beneficio: RhBeneficio | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState("");

  const assignedQuery = useQuery({
    queryKey: ["rh-beneficio-funcionarios", beneficio?.id],
    queryFn: () => rhService.listBeneficioFuncionarios(beneficio!.id),
    enabled: open && !!beneficio,
  });

  const funcionariosQuery = useQuery({
    queryKey: ["rh-funcionarios", { limit: 200 }],
    queryFn: () => rhService.list(1, 200),
    enabled: open,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["rh-beneficio-funcionarios", beneficio?.id] });

  const assignMutation = useMutation({
    mutationFn: (funcionarioId: string) => rhService.assignBeneficioFuncionario(beneficio!.id, funcionarioId),
    onSuccess: () => { invalidate(); setSelected(""); toast.success("Funcionario atribuido."); },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const removeMutation = useMutation({
    mutationFn: (funcionarioId: string) => rhService.removeBeneficioFuncionario(beneficio!.id, funcionarioId),
    onSuccess: () => { invalidate(); toast.success("Funcionario removido."); },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const assigned = assignedQuery.data?.items ?? [];
  const funcionarios = funcionariosQuery.data?.items ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Funcionarios — {beneficio?.nome}</DialogTitle>
          <DialogDescription>Defina quem recebe este beneficio (valor/dia x ponto).</DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger><SelectValue placeholder="Selecionar funcionario" /></SelectTrigger>
            <SelectContent>
              {funcionarios.map((f: { id: string; nome: string }) => (
                <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button disabled={!selected || assignMutation.isPending} onClick={() => assignMutation.mutate(selected)}>
            Atribuir
          </Button>
        </div>
        <ul className="flex flex-col gap-2">
          {assigned.map((v: { funcionario_id: string }) => {
            const nome = funcionarios.find((f: { id: string }) => f.id === v.funcionario_id)?.nome ?? v.funcionario_id;
            return (
              <li key={v.funcionario_id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <span>{nome}</span>
                <Button variant="ghost" size="sm" onClick={() => removeMutation.mutate(v.funcionario_id)}>
                  <Trash2 className="size-4" />
                </Button>
              </li>
            );
          })}
          {assigned.length === 0 && <li className="text-sm text-muted-foreground">Nenhum funcionario atribuido.</li>}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
