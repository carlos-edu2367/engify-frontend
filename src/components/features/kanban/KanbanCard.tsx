import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { GripVertical, Pencil, Trash2, User } from "lucide-react";
import type { ItemResponse } from "@/types/item.types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface KanbanCardProps {
  item: ItemResponse;
  isDragging?: boolean;
  canDrag?: boolean;
  onEdit?: (item: ItemResponse) => void;
  onDelete?: (item: ItemResponse) => void;
  onOpenDrawer?: (item: ItemResponse) => void;
  responsavelNome?: string;
}

export function KanbanCard({
  item,
  isDragging = false,
  canDrag = false,
  onEdit,
  onDelete,
  onOpenDrawer,
  responsavelNome,
}: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: item.id, disabled: !canDrag });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  function handleEditClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    onEdit?.(item);
  }

  function handleDeleteClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    onDelete?.(item);
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      layoutId={item.id}
      onClick={() => onOpenDrawer?.(item)}
      className={cn(
        "rounded-lg border bg-card p-3 shadow-sm select-none cursor-pointer hover:shadow-md transition-shadow",
        isSortableDragging && "opacity-40",
        isDragging && "kanban-drag-overlay"
      )}
    >
      <div className="flex items-start gap-2">
        {canDrag && (
          <button
            {...attributes}
            {...listeners}
            className="mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-tight">{item.title}</p>
          {item.descricao && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{item.descricao}</p>
          )}
          {responsavelNome && (
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span className="truncate">{responsavelNome}</span>
            </div>
          )}
        </div>
        {(onEdit || onDelete) && (
          <div className="flex shrink-0 gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
            {onEdit && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleEditClick}>
                <Pencil className="h-3 w-3" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={handleDeleteClick}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Versão overlay (durante drag) — sem sortable
export function KanbanCardOverlay({ item, responsavelNome }: Pick<KanbanCardProps, "item" | "responsavelNome">) {
  return (
    <div className="rounded-lg border bg-card p-3 shadow-2xl rotate-2 scale-105">
      <p className="text-sm font-medium">{item.title}</p>
      {item.descricao && (
        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{item.descricao}</p>
      )}
      {responsavelNome && (
        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <User className="h-3 w-3" />
          <span>{responsavelNome}</span>
        </div>
      )}
    </div>
  );
}
