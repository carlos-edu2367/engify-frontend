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
import type { RhRegraEncargoCreateRequest, RhTabelaProgressiva } from "@/types/rh.types";

function toDateTimeInputValue(value: string) {
  return value ? `${value}T00:00:00` : null;
}

function toDateInputValue(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

export function RegraEncargoDialog({
  open,
  onOpenChange,
  loading,
  tabelasProgressivas = [],
  initialData,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading?: boolean;
  tabelasProgressivas?: RhTabelaProgressiva[];
  initialData?: Partial<RhRegraEncargoCreateRequest> | null;
  onSubmit: (data: RhRegraEncargoCreateRequest) => void;
}) {
  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");
  const [natureza, setNatureza] = useState("desconto");
  const [tipoCalculo, setTipoCalculo] = useState("percentual_simples");
  const [baseCalculo, setBaseCalculo] = useState("salario_base");
  const [valorFixo, setValorFixo] = useState("");
  const [percentual, setPercentual] = useState("");
  const [tabelaProgressivaId, setTabelaProgressivaId] = useState("");
  const [teto, setTeto] = useState("");
  const [piso, setPiso] = useState("");
  const [prioridade, setPrioridade] = useState(100);
  const [vigenciaInicio, setVigenciaInicio] = useState("");
  const [vigenciaFim, setVigenciaFim] = useState("");

  useEffect(() => {
    if (!open) return;
    setNome(initialData?.nome ?? "");
    setCodigo(initialData?.codigo ?? "");
    setNatureza(initialData?.natureza ?? "desconto");
    setTipoCalculo(initialData?.tipo_calculo ?? "percentual_simples");
    setBaseCalculo(initialData?.base_calculo ?? "salario_base");
    setValorFixo(initialData?.valor_fixo ?? "");
    setPercentual(initialData?.percentual ?? "");
    setTabelaProgressivaId(initialData?.tabela_progressiva_id ?? "");
    setTeto(initialData?.teto ?? "");
    setPiso(initialData?.piso ?? "");
    setPrioridade(initialData?.prioridade ?? 100);
    setVigenciaInicio(toDateInputValue(initialData?.vigencia_inicio));
    setVigenciaFim(toDateInputValue(initialData?.vigencia_fim));
  }, [initialData, open]);

  const requiresPercentual = tipoCalculo === "percentual_simples";
  const requiresValorFixo = tipoCalculo === "valor_fixo";
  const requiresTabelaProgressiva = tipoCalculo === "tabela_progressiva";
  const validPercentual = !percentual || (Number(percentual) >= 0 && Number(percentual) <= 100);
  const validValorFixo = !valorFixo || Number(valorFixo) >= 0;
  const validVigencia = !vigenciaInicio || !vigenciaFim || vigenciaInicio <= vigenciaFim;
  const canSubmit =
    nome.trim() &&
    codigo.trim() &&
    prioridade >= 0 &&
    validPercentual &&
    validValorFixo &&
    validVigencia &&
    (!requiresPercentual || percentual) &&
    (!requiresValorFixo || valorFixo) &&
    (!requiresTabelaProgressiva || tabelaProgressivaId);

  const submit = () => {
    if (!canSubmit) return;
    onSubmit({
      nome: nome.trim(),
      codigo: codigo.trim().toUpperCase(),
      natureza,
      tipo_calculo: tipoCalculo,
      base_calculo: baseCalculo,
      valor_fixo: requiresValorFixo ? valorFixo : null,
      percentual: requiresPercentual ? percentual : null,
      tabela_progressiva_id: requiresTabelaProgressiva ? tabelaProgressivaId : null,
      teto: teto || null,
      piso: piso || null,
      prioridade,
      vigencia_inicio: toDateTimeInputValue(vigenciaInicio),
      vigencia_fim: toDateTimeInputValue(vigenciaFim),
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
                <SelectItem value="percentual_simples">Percentual</SelectItem>
                <SelectItem value="valor_fixo">Valor fixo</SelectItem>
                <SelectItem value="tabela_progressiva">Progressivo</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Base de calculo</span>
            <Select value={baseCalculo} onValueChange={setBaseCalculo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="salario_base">Salario base</SelectItem>
                <SelectItem value="salario_base_mais_extras">Salario base + extras</SelectItem>
                <SelectItem value="bruto_antes_encargos">Bruto antes dos encargos</SelectItem>
                <SelectItem value="bruto_antes_irrf">Bruto antes do IRRF</SelectItem>
                <SelectItem value="liquido_parcial">Liquido parcial</SelectItem>
                <SelectItem value="valor_referencia_manual">Referencia manual</SelectItem>
              </SelectContent>
            </Select>
          </label>
          {requiresPercentual ? (
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Percentual</span>
              <Input type="number" min={0} max={100} step="0.01" value={percentual} onChange={(event) => setPercentual(event.target.value)} />
              {!validPercentual ? <span className="text-xs text-destructive">Informe um percentual entre 0 e 100.</span> : null}
            </label>
          ) : null}
          {requiresValorFixo ? (
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Valor fixo</span>
              <Input type="number" min={0} step="0.01" value={valorFixo} onChange={(event) => setValorFixo(event.target.value)} />
              {!validValorFixo ? <span className="text-xs text-destructive">Informe um valor maior ou igual a zero.</span> : null}
            </label>
          ) : null}
          {requiresTabelaProgressiva ? (
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Tabela progressiva</span>
              <Select value={tabelaProgressivaId} onValueChange={setTabelaProgressivaId}>
                <SelectTrigger><SelectValue placeholder="Selecione uma tabela" /></SelectTrigger>
                <SelectContent>
                  {tabelasProgressivas.map((tabela) => (
                    <SelectItem key={tabela.id} value={tabela.id}>
                      {tabela.nome} ({tabela.codigo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!tabelasProgressivas.length ? (
                <span className="text-xs text-muted-foreground">Cadastre uma tabela progressiva antes de criar este tipo de regra.</span>
              ) : null}
            </label>
          ) : null}
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Prioridade</span>
            <Input type="number" min={0} value={prioridade} onChange={(event) => setPrioridade(Number(event.target.value))} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Piso</span>
            <Input type="number" min={0} step="0.01" value={piso} onChange={(event) => setPiso(event.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Teto</span>
            <Input type="number" min={0} step="0.01" value={teto} onChange={(event) => setTeto(event.target.value)} />
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
