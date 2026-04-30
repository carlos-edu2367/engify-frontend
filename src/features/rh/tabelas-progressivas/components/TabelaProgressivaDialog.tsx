import { useMemo, useState } from "react";
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
import type { RhFaixaEncargo, RhTabelaProgressivaFormData } from "@/types/rh.types";
import { FaixasProgressivasEditor } from "./FaixasProgressivasEditor";

const initialFaixas: RhFaixaEncargo[] = [
  { ordem: 0, valor_inicial: "0", valor_final: "", aliquota: "0", deducao: "0", calculo_marginal: false },
];

function toDateTimeInputValue(value: string) {
  return value ? `${value}T00:00:00` : null;
}

export function TabelaProgressivaDialog({
  open,
  onOpenChange,
  loading,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading?: boolean;
  onSubmit: (data: RhTabelaProgressivaFormData) => void;
}) {
  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");
  const [vigenciaInicio, setVigenciaInicio] = useState("");
  const [vigenciaFim, setVigenciaFim] = useState("");
  const [faixas, setFaixas] = useState<RhFaixaEncargo[]>(initialFaixas);

  const orderedFaixas = useMemo(
    () =>
      [...faixas]
        .sort((a, b) => Number(a.valor_inicial || 0) - Number(b.valor_inicial || 0))
        .map((faixa, index) => ({ ...faixa, ordem: index })),
    [faixas]
  );
  const hasInvalidFaixa = orderedFaixas.some((faixa, index) => {
    const inicio = Number(faixa.valor_inicial);
    const fim = faixa.valor_final ? Number(faixa.valor_final) : null;
    const next = orderedFaixas[index + 1];
    return !Number.isFinite(inicio)
      || (fim !== null && fim < inicio)
      || Number(faixa.aliquota) < 0
      || Number(faixa.aliquota) > 100
      || (next ? Number(next.valor_inicial) <= (fim ?? inicio) : false);
  });
  const validVigencia = !vigenciaInicio || !vigenciaFim || vigenciaInicio <= vigenciaFim;
  const canSubmit = nome.trim() && codigo.trim() && validVigencia && !hasInvalidFaixa;

  const submit = () => {
    if (!canSubmit) return;
    onSubmit({
      nome: nome.trim(),
      codigo: codigo.trim().toUpperCase(),
      vigencia_inicio: toDateTimeInputValue(vigenciaInicio),
      vigencia_fim: toDateTimeInputValue(vigenciaFim),
      faixas: orderedFaixas,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Nova tabela</DialogTitle>
          <DialogDescription>Cadastre faixas de calculo usadas por regras progressivas.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Nome</span>
            <Input value={nome} onChange={(event) => setNome(event.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Codigo</span>
            <Input value={codigo} onChange={(event) => setCodigo(event.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Inicio da vigencia</span>
            <Input type="date" value={vigenciaInicio} onChange={(event) => setVigenciaInicio(event.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Fim da vigencia</span>
            <Input type="date" value={vigenciaFim} onChange={(event) => setVigenciaFim(event.target.value)} />
            {!validVigencia ? <span className="text-xs text-destructive">A data final deve ser posterior ao inicio.</span> : null}
          </label>
        </div>
        <FaixasProgressivasEditor value={faixas} onChange={setFaixas} />
        {hasInvalidFaixa ? <p className="text-sm text-destructive">Revise as faixas para evitar valores invalidos ou sobrepostos.</p> : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={submit} disabled={loading || !canSubmit}>
            <Save className="size-4" />
            {loading ? "Salvando..." : "Salvar tabela"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
