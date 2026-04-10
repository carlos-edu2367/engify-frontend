import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAllCategoriasObras } from "@/hooks/useCategoriasObras";

interface CategoriaObraSelectProps {
  value?: string | null;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

const NO_CATEGORIA = "__none__";

export function CategoriaObraSelect({
  value,
  onValueChange,
  placeholder = "Sem categoria",
  disabled,
}: CategoriaObraSelectProps) {
  const { data, isLoading } = useAllCategoriasObras();
  const categorias = data?.items ?? [];

  function handleChange(v: string) {
    onValueChange(v === NO_CATEGORIA ? null : v);
  }

  return (
    <Select
      value={value ?? NO_CATEGORIA}
      onValueChange={handleChange}
      disabled={disabled || isLoading}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder}>
          {value ? (
            <CategoriaValueDisplay
              categoriaId={value}
              categorias={categorias}
            />
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NO_CATEGORIA}>
          <span className="text-muted-foreground">Sem categoria</span>
        </SelectItem>
        {categorias.map((cat) => (
          <SelectItem key={cat.id} value={cat.id}>
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: cat.cor ?? "#64748b" }}
              />
              {cat.title}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function CategoriaValueDisplay({
  categoriaId,
  categorias,
}: {
  categoriaId: string;
  categorias: { id: string; title: string; cor?: string | null }[];
}) {
  const cat = categorias.find((c) => c.id === categoriaId);
  if (!cat) return <span>{categoriaId}</span>;
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: cat.cor ?? "#64748b" }}
      />
      {cat.title}
    </div>
  );
}
