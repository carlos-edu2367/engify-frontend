import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { RhTipoPonto } from "@/types/rh.types";
import { useEditarDia, usePontoDiaDetalhe } from "../hooks/usePontoOperacional";

type BatidaRow = { key: string; tipo: RhTipoPonto; hora: string };

function toHora(timestamp: string): string {
  const date = new Date(timestamp);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function DayEditorDialog({
  open,
  onOpenChange,
  funcionarioId,
  data,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funcionarioId: string | null;
  data: string | null;
}) {
  const diaQuery = usePontoDiaDetalhe(funcionarioId, data);
  const editarDia = useEditarDia();
  const [batidas, setBatidas] = useState<BatidaRow[]>([]);
  const [motivo, setMotivo] = useState("");

  useEffect(() => {
    if (!open) return;
    const registros = diaQuery.data?.registros ?? [];
    setBatidas(
      [...registros]
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .map((registro) => ({ key: registro.id, tipo: registro.tipo, hora: toHora(registro.timestamp) })),
    );
    setMotivo("");
  }, [open, diaQuery.data]);

  const addBatida = () => {
    setBatidas((prev) => [...prev, { key: `nova-${prev.length}-${Date.now()}`, tipo: "entrada", hora: "08:00" }]);
  };

  const removeBatida = (key: string) => {
    setBatidas((prev) => prev.filter((row) => row.key !== key));
  };

  const updateBatida = (key: string, patch: Partial<Pick<BatidaRow, "tipo" | "hora">>) => {
    setBatidas((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  };

  const handleSave = () => {
    if (!funcionarioId || !data) return;
    editarDia.mutate(
      {
        funcionario_id: funcionarioId,
        data,
        batidas: batidas.map((row) => ({ tipo: row.tipo, hora: `${row.hora}:00` })),
        motivo,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar dia</DialogTitle>
          <DialogDescription>
            Corrige todas as batidas do dia de uma vez. Substitui os registros existentes e marca o dia como
            ajustado.
          </DialogDescription>
        </DialogHeader>

        {diaQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando registros do dia...</p>
        ) : (
          <div className="space-y-2">
            {batidas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma batida. Adicione entrada e saida.</p>
            ) : null}
            {batidas.map((row) => (
              <div key={row.key} className="flex items-center gap-2">
                <Select value={row.tipo} onValueChange={(value) => updateBatida(row.key, { tipo: value as RhTipoPonto })}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saida</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="time"
                  value={row.hora}
                  onChange={(event) => updateBatida(row.key, { hora: event.target.value })}
                  className="w-32"
                />
                <Button variant="ghost" size="sm" onClick={() => removeBatida(row.key)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addBatida}>
              <Plus className="size-4" />
              Adicionar batida
            </Button>
          </div>
        )}

        <Textarea
          value={motivo}
          onChange={(event) => setMotivo(event.target.value)}
          rows={3}
          placeholder="Motivo da correcao (obrigatorio)"
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={editarDia.isPending}>
            Cancelar
          </Button>
          <Button
            disabled={!motivo.trim() || editarDia.isPending || diaQuery.isLoading}
            onClick={handleSave}
          >
            {editarDia.isPending ? "Salvando..." : "Salvar dia"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
