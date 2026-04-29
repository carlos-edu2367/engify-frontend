import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const entities = [
  { value: "funcionario", label: "Funcionario" },
  { value: "holerite", label: "Holerite" },
  { value: "ponto", label: "Ponto" },
  { value: "ferias", label: "Ferias" },
  { value: "atestado", label: "Atestado" },
  { value: "regra_encargo", label: "Regra de encargo" },
];

export function EntityPicker({ value, onChange }: { value?: string; onChange: (value: string) => void }) {
  return (
    <Select value={value || "all"} onValueChange={(next) => onChange(next === "all" ? "" : next)}>
      <SelectTrigger aria-label="Entidade auditada">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todas as entidades</SelectItem>
        {entities.map((entity) => <SelectItem key={entity.value} value={entity.value}>{entity.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
