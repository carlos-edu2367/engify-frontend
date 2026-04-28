import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import type { ItemResponse, ItemStatus } from "@/types/item.types";
import { KanbanCard } from "./KanbanCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const columnConfig: Record<ItemStatus, { label: string; color: string }> = {
  planejamento: { label: "Planejamento", color: "bg-indigo-500" },
  em_andamento: { label: "Em Andamento", color: "bg-amber-500" },
  financeiro: { label: "Financeiro", color: "bg-emerald-500" },
  finalizado: { label: "Finalizado", color: "bg-slate-500" },
};

interface KanbanColumnProps {
  status: ItemStatus;
  items: ItemResponse[];
  canDrag?: boolean;
  onAddItem?: (status: ItemStatus) => void;
  onEditItem?: (item: ItemResponse) => void;
  onDeleteItem?: (item: ItemResponse) => void;
  onMoveItemBackward?: (itemId: string) => void;
  onMoveItemForward?: (itemId: string) => void;
  onOpenDrawer?: (item: ItemResponse) => void;
  usersMap?: Record<string, string>;
  className?: string;
}

export function KanbanColumn({
  status,
  items,
  canDrag = false,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onMoveItemBackward,
  onMoveItemForward,
  onOpenDrawer,
  usersMap = {},
  className,
}: KanbanColumnProps) {
  const config = columnConfig[status];
  const itemIds = items.map((i) => i.id);

  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-xl border bg-muted/40 p-3 transition-colors",
        className,
        isOver && "bg-muted/70 ring-2 ring-primary/30"
      )}
    >
      {/* Header da coluna */}
      <div className="flex items-center gap-2 mb-3">
        <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", config.color)} />
        <span className="text-sm font-semibold flex-1">{config.label}</span>
        <span className="text-xs text-muted-foreground bg-background rounded-full px-2 py-0.5">
          {items.length}
        </span>
      </div>

      {/* Cards */}
      <div ref={setNodeRef} className="flex flex-col gap-2 flex-1 min-h-[60px]">
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <div key={item.id} className="group">
              <KanbanCard
                item={item}
                canDrag={canDrag}
                onEdit={onEditItem}
                onDelete={onDeleteItem}
                onMoveBackward={status !== "planejamento" ? onMoveItemBackward : undefined}
                onMoveForward={status !== "finalizado" ? onMoveItemForward : undefined}
                onOpenDrawer={onOpenDrawer}
                responsavelNome={item.responsavel_id ? usersMap[item.responsavel_id] : undefined}
              />
            </div>
          ))}
        </SortableContext>
      </div>

      {/* Botão adicionar */}
      {canDrag && onAddItem && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => onAddItem(status)}
        >
          <Plus className="h-4 w-4" />
          Adicionar item
        </Button>
      )}
    </div>
  );
}
