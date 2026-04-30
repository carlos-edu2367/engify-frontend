import { useEffect, useState } from "react";
import { Save } from "lucide-react";
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
import type { RhBeneficio, RhBeneficioCreateRequest } from "@/types/rh.types";

export function BeneficioDialog({
  open,
  onOpenChange,
  beneficio,
  loading,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  beneficio?: RhBeneficio | null;
  loading?: boolean;
  onSubmit: (data: RhBeneficioCreateRequest) => void;
}) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [status, setStatus] = useState("ativo");

  useEffect(() => {
    if (!open) return;
    setNome(beneficio?.nome ?? "");
    setDescricao(beneficio?.descricao ?? "");
    setStatus(beneficio?.status ?? "ativo");
  }, [beneficio, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{beneficio ? "Editar beneficio" : "Novo beneficio"}</DialogTitle>
          <DialogDescription>Cadastre as opcoes disponiveis para administracao de RH.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Nome</span>
            <Input value={nome} onChange={(event) => setNome(event.target.value)} placeholder="Ex.: Vale transporte" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Descricao</span>
            <Textarea value={descricao} onChange={(event) => setDescricao(event.target.value)} placeholder="Resumo de uso interno" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Status</span>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={() => onSubmit({ nome: nome.trim(), descricao: descricao.trim() || null, status })}
            disabled={loading || !nome.trim()}
          >
            <Save className="size-4" />
            {loading ? "Salvando..." : "Salvar beneficio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
