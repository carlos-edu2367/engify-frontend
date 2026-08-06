import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { financeiroService } from "@/services/financeiro.service";
import { registrarSaidaSchema, type RegistrarSaidaFormValues } from "@/lib/schemas/financeiro.schemas";
import { classeLabels } from "@/lib/financeiro-labels";
import { getApiErrorMessage } from "@/lib/utils";
import type { MovClass } from "@/types/financeiro.types";

interface RegistrarSaidaDialogProps {
  obraId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIrParaRecebimentos: () => void;
}

export function RegistrarSaidaDialog({
  obraId,
  open,
  onOpenChange,
  onIrParaRecebimentos,
}: RegistrarSaidaDialogProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<RegistrarSaidaFormValues>({
    resolver: zodResolver(registrarSaidaSchema),
  });

  const mutation = useMutation({
    mutationFn: (values: RegistrarSaidaFormValues) =>
      financeiroService.createMovimentacao({
        title: values.title,
        valor: values.valor,
        classe: values.classe,
        type: "saida",
        obra_id: obraId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obras", obraId, "financeiro"] });
      queryClient.invalidateQueries({ queryKey: ["financeiro"] });
      toast.success("Saída registrada!");
      reset();
      onOpenChange(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar saída</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Título *</Label>
            <Input placeholder="Ex: Compra de cimento" {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Valor *</Label>
              <Input placeholder="3200.00" {...register("valor")} />
              {errors.valor && <p className="text-xs text-destructive">{errors.valor.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Classe *</Label>
              <Select onValueChange={(v) => setValue("classe", v as MovClass)}>
                <SelectTrigger><SelectValue placeholder="Classe..." /></SelectTrigger>
                <SelectContent>
                  {Object.entries(classeLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.classe && <p className="text-xs text-destructive">{errors.classe.message}</p>}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Recebimentos da obra são registrados na{" "}
            <button
              type="button"
              className="text-primary underline underline-offset-2"
              onClick={() => {
                onOpenChange(false);
                onIrParaRecebimentos();
              }}
            >
              aba Recebimentos
            </button>
            .
          </p>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Registrando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
