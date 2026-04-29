import { CheckCircle2 } from "lucide-react";

export type RhImpactChecklistItem = {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
};

export function RhImpactChecklist({
  items,
  onToggle,
}: {
  items: RhImpactChecklistItem[];
  onToggle: (id: string, checked: boolean) => void;
}) {
  return (
    <div className="space-y-2 rounded-md border p-3">
      {items.map((item) => (
        <label key={item.id} className="flex cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-muted/50">
          <input
            type="checkbox"
            className="mt-1"
            checked={item.checked}
            onChange={(event) => onToggle(item.id, event.target.checked)}
          />
          <span className="flex-1">
            <span className="flex items-center gap-2 text-sm font-medium">
              {item.checked ? <CheckCircle2 className="size-4 text-emerald-600" /> : null}
              {item.label}
            </span>
            {item.description ? <span className="mt-1 block text-xs text-muted-foreground">{item.description}</span> : null}
          </span>
        </label>
      ))}
    </div>
  );
}
