import { useState } from "react";
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
import type { RhRegraEncargoCreateRequest } from "@/types/rh.types";

export function RegraEncargoDialog({
  open,
  onOpenChange,
  loading,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading?: boolean;
  onSubmit: (data: RhRegraEncargoCreateRequest) => void;
}) {
  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");
  const [natureza, setNatureza] = useState("desconto");
  const [tipoCalculo, setTipoCalculo] = useState("percentual");
  const [baseCalculo, setBaseCalculo] = useState("salario_base");
  const [percentual, setPercentual] = useState("");
  const [prioridade, setPrioridade] = useState(0);
  const [vigenciaInicio, setVigenciaInicio] = useState("");
  const [vigenciaFim, setVigenciaFim] = useState("");

  const validPercentual = !percentual || (Number(percentual) >= 0 && Number(percentual) <= 100);
  const validVigencia = !vigenciaInicio || !vigenciaFim || vigenciaInicio <= vigenciaFim;
  const canSubmit = nome.trim() && codigo.trim() && prioridade >= 0 && validPercentual && validVigencia;

  const submit = () => {
    if (!canSubmit) return;
    onSubmit({
      nome: nome.trim(),
      codigo: codigo.trim().toUpperCase(),
      natureza,
      tipo_calculo: tipoCalculo,
      base_calculo: baseCalculo || null,
      percentual: percentual || null,
      prioridade,
      vigencia_inicio: vigenciaInicio || null,
      vigencia_fim: vigenciaFim || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova regra</DialogTitle>
          <DialogDescription>Configure calculo, vigencia e aplicacao em folha.</DialogDescription>
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
            <span className="text-sm font-medium">Natureza</span>
            <Select value={natureza} onValueChange={setNatureza}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="provento">Provento</SelectItem>
                <SelectItem value="desconto">Desconto</SelectItem>
                <SelectItem value="informativo">Informativo</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Tipo de calculo</span>
            <Select value={tipoCalculo} onValueChange={setTipoCalculo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="percentual">Percentual</SelectItem>
                <SelectItem value="valor_fixo">Valor fixo</SelectItem>
                <SelectItem value="progressivo">Progressivo</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Base de calculo</span>
            <Input value={baseCalculo} onChange={(event) => setBaseCalculo(event.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Percentual</span>
            <Input type="number" min={0} max={100} step="0.01" value={percentual} onChange={(event) => setPercentual(event.target.value)} />
            {!validPercentual ? <span className="text-xs text-destructive">Informe um percentual entre 0 e 100.</span> : null}
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Prioridade</span>
            <Input type="number" min={0} value={prioridade} onChange={(event) => setPrioridade(Number(event.target.value))} />
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
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={submit} disabled={loading || !canSubmit}>
            <Save className="size-4" />
            {loading ? "Salvando..." : "Salvar regra"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
