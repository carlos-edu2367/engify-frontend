import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RhFaixaEncargo } from "@/types/rh.types";

export function FaixasProgressivasEditor({
  value,
  onChange,
}: {
  value: RhFaixaEncargo[];
  onChange: (value: RhFaixaEncargo[]) => void;
}) {
  const update = (index: number, patch: Partial<RhFaixaEncargo>) => {
    onChange(value.map((faixa, current) => (current === index ? { ...faixa, ...patch } : faixa)));
  };

  const remove = (index: number) => onChange(value.filter((_, current) => current !== index));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">Faixas progressivas</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...value, { inicio: "", fim: "", aliquota: "", deducao: "0" }])}
        >
          <Plus className="size-4" />
          Adicionar faixa
        </Button>
      </div>
      <div className="flex flex-col gap-3">
        {value.map((faixa, index) => (
          <div key={index} className="grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_1fr_1fr_1fr_auto]">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Valor inicial</span>
              <Input type="number" min={0} value={faixa.inicio} onChange={(event) => update(index, { inicio: event.target.value })} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Valor final</span>
              <Input type="number" min={0} value={faixa.fim ?? ""} onChange={(event) => update(index, { fim: event.target.value || null })} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Aliquota</span>
              <Input type="number" min={0} max={100} step="0.01" value={faixa.aliquota} onChange={(event) => update(index, { aliquota: event.target.value })} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Deducao</span>
              <Input type="number" min={0} step="0.01" value={faixa.deducao ?? ""} onChange={(event) => update(index, { deducao: event.target.value || null })} />
            </label>
            <Button type="button" variant="outline" size="sm" className="self-end" onClick={() => remove(index)} disabled={value.length <= 1}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        As faixas sao enviadas em ordem de valor inicial. Evite sobreposicoes para manter o calculo previsivel.
      </p>
    </div>
  );
}
