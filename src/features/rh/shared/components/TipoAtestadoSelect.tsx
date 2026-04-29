import { useState } from "react";
import { useTiposAtestado } from "../../atestados/hooks/useAtestadosOperacionais";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function TipoAtestadoSelect({
  value,
  onChange,
}: {
  value?: string;
  onChange: (value: string) => void;
}) {
  const [page] = useState(1);
  const query = useTiposAtestado(page, 30);
  const items = query.data?.items ?? [];

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label="Tipo de atestado">
        <SelectValue placeholder={query.isLoading ? "Carregando tipos..." : "Tipo de atestado"} />
      </SelectTrigger>
      <SelectContent>
        {items.length === 0 ? <SelectItem value="__empty" disabled>Nenhum tipo disponivel</SelectItem> : null}
        {items.map((tipo) => (
          <SelectItem key={tipo.id} value={tipo.id}>{tipo.nome}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
