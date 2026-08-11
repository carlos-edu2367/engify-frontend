import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/utils";
import { rhService } from "@/services/rh.service";

// "sv-SE" formata como aaaa-mm-dd, que e o formato do input type="date".
function primeiroDiaDoMes() {
  const hoje = new Date();
  return new Date(hoje.getFullYear(), hoje.getMonth(), 1).toLocaleDateString("sv-SE");
}

function ultimoDiaDoMes() {
  const hoje = new Date();
  return new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toLocaleDateString("sv-SE");
}

export function ExportarCartoesDialog({
  open,
  onOpenChange,
  funcionarioId,
  funcionarioNome,
  startInicial,
  endInicial,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funcionarioId?: string;
  funcionarioNome?: string;
  startInicial?: string;
  endInicial?: string;
}) {
  const [start, setStart] = useState(startInicial || primeiroDiaDoMes());
  const [end, setEnd] = useState(endInicial || ultimoDiaDoMes());

  useEffect(() => {
    if (open) {
      setStart(startInicial || primeiroDiaDoMes());
      setEnd(endInicial || ultimoDiaDoMes());
    }
  }, [open, startInicial, endInicial]);

  const periodoInvalido = !start || !end || end < start;

  const exportMutation = useMutation({
    mutationFn: () => rhService.exportarCartoesPonto({ start, end, funcionario_id: funcionarioId }),
    onSuccess: ({ blob, filename }) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Exportação concluída.");
      onOpenChange(false);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Exportar cartões de ponto</DialogTitle>
          <DialogDescription>
            {funcionarioNome
              ? `Gera o cartão de ${funcionarioNome} no período escolhido.`
              : "Gera uma aba por funcionário ativo no período escolhido."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Início</span>
            <Input type="date" value={start} onChange={(event) => setStart(event.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Fim</span>
            <Input type="date" value={end} onChange={(event) => setEnd(event.target.value)} />
          </label>
        </div>
        {periodoInvalido ? (
          <p className="text-xs text-destructive">Informe um período válido, com o fim depois do início.</p>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={exportMutation.isPending}>
            Cancelar
          </Button>
          <Button onClick={() => exportMutation.mutate()} disabled={periodoInvalido || exportMutation.isPending}>
            {exportMutation.isPending ? "Gerando..." : "Exportar XLSX"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
