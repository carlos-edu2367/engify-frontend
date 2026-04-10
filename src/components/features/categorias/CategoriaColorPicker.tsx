import { cn } from "@/lib/utils";

// Paleta pré-definida alinhada ao estilo shadcn/tailwind
export const CATEGORIA_CORES_PREDEFINIDAS = [
  { label: "Cinza", value: "#64748b" },
  { label: "Azul", value: "#3b82f6" },
  { label: "Ciano", value: "#06b6d4" },
  { label: "Verde", value: "#10b981" },
  { label: "Lima", value: "#84cc16" },
  { label: "Âmbar", value: "#f59e0b" },
  { label: "Laranja", value: "#f97316" },
  { label: "Vermelho", value: "#ef4444" },
  { label: "Rosa", value: "#ec4899" },
  { label: "Violeta", value: "#8b5cf6" },
  { label: "Índigo", value: "#6366f1" },
  { label: "Teal", value: "#14b8a6" },
] as const;

interface CategoriaColorPickerProps {
  value?: string;
  onChange: (cor: string) => void;
}

export function CategoriaColorPicker({ value, onChange }: CategoriaColorPickerProps) {
  const isCustom =
    !!value && !CATEGORIA_CORES_PREDEFINIDAS.some((c) => c.value === value);

  return (
    <div className="space-y-2">
      {/* Paleta pré-definida */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIA_CORES_PREDEFINIDAS.map((cor) => (
          <button
            key={cor.value}
            type="button"
            title={cor.label}
            onClick={() => onChange(cor.value)}
            className={cn(
              "h-7 w-7 rounded-full border-2 transition-transform hover:scale-110",
              value === cor.value
                ? "border-foreground scale-110"
                : "border-transparent"
            )}
            style={{ backgroundColor: cor.value }}
          />
        ))}

        {/* Opção personalizada */}
        <label
          title="Cor personalizada"
          className={cn(
            "relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 transition-transform hover:scale-110",
            isCustom ? "border-foreground scale-110" : "border-dashed border-muted-foreground/40"
          )}
          style={isCustom ? { backgroundColor: value } : undefined}
        >
          {!isCustom && (
            <span className="text-[10px] font-bold text-muted-foreground">+</span>
          )}
          <input
            type="color"
            className="absolute inset-0 h-full w-full cursor-pointer rounded-full opacity-0"
            value={isCustom ? value : "#6366f1"}
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
      </div>

      {/* Preview da cor selecionada */}
      {value && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: value }}
          />
          {CATEGORIA_CORES_PREDEFINIDAS.find((c) => c.value === value)?.label ??
            "Cor personalizada"}
          <span className="font-mono">{value}</span>
        </div>
      )}
    </div>
  );
}
