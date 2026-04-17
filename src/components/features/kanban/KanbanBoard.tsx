import { type UIEvent, useRef, useState, useMemo } from "react";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragCancelEvent,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ItemResponse, ItemStatus } from "@/types/item.types";
import type { ObraResponse, ObraStatus } from "@/types/obra.types";
import { itemsService } from "@/services/items.service";
import { obrasService } from "@/services/obras.service";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCardOverlay } from "./KanbanCard";
import { ItemDrawer } from "./ItemDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { itemSchema, type ItemFormValues } from "@/lib/schemas/obra.schemas";
import { cn, getApiErrorMessage } from "@/lib/utils";

const STATUSES: ItemStatus[] = ["planejamento", "em_andamento", "finalizado"];
const STATUS_LABELS: Record<ItemStatus, string> = {
  planejamento: "Planejamento",
  em_andamento: "Em andamento",
  finalizado: "Finalizado",
};

function computeObraStatus(items: ItemResponse[]): ObraStatus {
  if (items.length === 0) return "planejamento";
  if (items.every((i) => i.status === "finalizado")) return "finalizado";
  if (items.some((i) => i.status === "em_andamento")) return "em_andamento";
  return "planejamento";
}

function groupItemsByStatus(items: ItemResponse[]) {
  const grouped: Record<ItemStatus, ItemResponse[]> = {
    planejamento: [],
    em_andamento: [],
    finalizado: [],
  };

  for (const item of items) {
    grouped[item.status].push(item);
  }

  return grouped;
}

interface KanbanBoardProps {
  obraId: string;
  items: ItemResponse[];
  canEdit: boolean;
  usersMap?: Record<string, string>;
}

export function KanbanBoard({ obraId, items, canEdit, usersMap = {} }: KanbanBoardProps) {
  const queryClient = useQueryClient();

  function syncObraStatus(updatedItems: ItemResponse[]) {
    const newStatus = computeObraStatus(updatedItems);
    const current = queryClient.getQueryData<ObraResponse>(["obras", obraId]);
    if (!current || current.status === newStatus) return;
    queryClient.setQueryData<ObraResponse>(["obras", obraId], { ...current, status: newStatus });
    obrasService.updateStatus(obraId, { status: newStatus }).catch(() => {
      queryClient.invalidateQueries({ queryKey: ["obras", obraId] });
    });
  }

  const [activeItem, setActiveItem] = useState<ItemResponse | null>(null);
  const [addingToStatus, setAddingToStatus] = useState<ItemStatus | null>(null);
  const [editingItem, setEditingItem] = useState<ItemResponse | null>(null);
  const [deletingItem, setDeletingItem] = useState<ItemResponse | null>(null);
  const [drawerItem, setDrawerItem] = useState<ItemResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [mobileStatus, setMobileStatus] = useState<ItemStatus>("planejamento");
  const mobileColumnsRef = useRef<Record<ItemStatus, HTMLDivElement | null>>({
    planejamento: null,
    em_andamento: null,
    finalizado: null,
  });

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 220, tolerance: 10 },
    })
  );

  // Agrupa items por status
  const itemsByStatus = useMemo(() => {
    return groupItemsByStatus(items);
  }, [items]);

  function handleDragStart(event: DragStartEvent) {
    setIsDragging(true);
    const item = items.find((i) => i.id === event.active.id);
    setActiveItem(item ?? null);
  }

  function handleDragCancel(_: DragCancelEvent) {
    setIsDragging(false);
    setActiveItem(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setIsDragging(false);
    setActiveItem(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Determina o status destino
    const targetStatus = STATUSES.includes(overId as ItemStatus)
      ? (overId as ItemStatus)
      : items.find((i) => i.id === overId)?.status;

    if (!targetStatus) return;
    moveItem(activeId, targetStatus, overId);
  }

  function moveItem(itemId: string, targetStatus: ItemStatus, overId?: string) {
    let didUpdate = false;
    queryClient.setQueryData<ItemResponse[]>(["obras", obraId, "items"], (old = []) => {
      const board = groupItemsByStatus(old);
      const sourceStatus = STATUSES.find((status) => board[status].some((i) => i.id === itemId));
      if (!sourceStatus) return old;

      const sourceItems = board[sourceStatus];
      const sourceIndex = sourceItems.findIndex((i) => i.id === itemId);
      if (sourceIndex === -1) return old;

      const movingItem = sourceItems[sourceIndex];
      if (!movingItem) return old;

      if (sourceStatus === targetStatus) {
        if (!overId) return old;
        const targetIndex =
          overId === targetStatus
            ? sourceItems.length - 1
            : sourceItems.findIndex((i) => i.id === overId);

        if (targetIndex === -1 || targetIndex === sourceIndex) return old;
        board[targetStatus] = arrayMove(sourceItems, sourceIndex, targetIndex);
      } else {
        const [moving] = sourceItems.splice(sourceIndex, 1);
        const targetItems = board[targetStatus];
        const overIndex = overId ? targetItems.findIndex((i) => i.id === overId) : -1;
        const insertionIndex = overIndex === -1 ? targetItems.length : overIndex;
        targetItems.splice(insertionIndex, 0, { ...moving, status: targetStatus });
      }

      didUpdate = true;
      return STATUSES.flatMap((status) => board[status]);
    });

    if (!didUpdate) return;

    const updatedItems = queryClient.getQueryData<ItemResponse[]>(["obras", obraId, "items"]) ?? [];
    syncObraStatus(updatedItems);

    itemsService.update(obraId, itemId, { status: targetStatus }).catch(() => {
      toast.error("Erro ao mover item. Revertendo...");
      queryClient.invalidateQueries({ queryKey: ["obras", obraId, "items"] });
      queryClient.invalidateQueries({ queryKey: ["obras", obraId] });
    });
  }

  function handleStepStatus(itemId: string, direction: "backward" | "forward") {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const currentStatusIndex = STATUSES.indexOf(item.status);
    if (currentStatusIndex === -1) return;

    const targetIndex = direction === "forward" ? currentStatusIndex + 1 : currentStatusIndex - 1;
    const targetStatus = STATUSES[targetIndex];
    if (!targetStatus) return;

    moveItem(itemId, targetStatus);
  }

  function scrollToMobileColumn(status: ItemStatus) {
    setMobileStatus(status);
    mobileColumnsRef.current[status]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "start",
    });
  }

  function handleMobileBoardScroll(e: UIEvent<HTMLDivElement>) {
    if (isDragging) return;
    const container = e.currentTarget;
    const center = container.scrollLeft + container.clientWidth / 2;

    let closestStatus: ItemStatus = mobileStatus;
    let closestDistance = Number.POSITIVE_INFINITY;

    for (const status of STATUSES) {
      const el = mobileColumnsRef.current[status];
      if (!el) continue;
      const elCenter = el.offsetLeft + el.clientWidth / 2;
      const distance = Math.abs(center - elCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestStatus = status;
      }
    }

    if (closestStatus !== mobileStatus) {
      setMobileStatus(closestStatus);
    }
  }

  // Form para criar/editar item
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormValues>({ resolver: zodResolver(itemSchema) });

  function openAddDialog(status: ItemStatus) {
    reset();
    setAddingToStatus(status);
  }

  function openEditDialog(item: ItemResponse) {
    reset({ title: item.title, descricao: item.descricao, responsavel_id: item.responsavel_id });
    setEditingItem(item);
  }

  async function onSubmitCreate(values: ItemFormValues) {
    try {
      const newItem = await itemsService.create(obraId, values);
      queryClient.setQueryData<ItemResponse[]>(["obras", obraId, "items"], (old = []) => [
        ...old,
        { ...newItem, status: addingToStatus! },
      ]);
      const updatedItems = queryClient.getQueryData<ItemResponse[]>(["obras", obraId, "items"]) ?? [];
      syncObraStatus(updatedItems);
      setAddingToStatus(null);
      reset();
      toast.success("Item criado com sucesso!");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
      queryClient.invalidateQueries({ queryKey: ["obras", obraId, "items"] });
    }
  }

  async function onSubmitEdit(values: ItemFormValues) {
    if (!editingItem) return;
    try {
      const updated = await itemsService.update(obraId, editingItem.id, values);
      queryClient.setQueryData<ItemResponse[]>(["obras", obraId, "items"], (old = []) =>
        old.map((i) => (i.id === editingItem.id ? updated : i))
      );
      setEditingItem(null);
      reset();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  async function handleDeleteConfirm() {
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      await itemsService.delete(obraId, deletingItem.id);
      queryClient.setQueryData<ItemResponse[]>(["obras", obraId, "items"], (old = []) =>
        old.filter((i) => i.id !== deletingItem.id)
      );
      const updatedItems = queryClient.getQueryData<ItemResponse[]>(["obras", obraId, "items"]) ?? [];
      syncObraStatus(updatedItems);
      setDeletingItem(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <DndContext
        collisionDetection={closestCorners}
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
      >
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1 md:hidden">
          {STATUSES.map((status) => (
            <Button
              key={status}
              type="button"
              variant={mobileStatus === status ? "default" : "outline"}
              className={cn("h-10 snap-start whitespace-nowrap px-4", mobileStatus === status && "shadow-sm")}
              onClick={() => scrollToMobileColumn(status)}
            >
              {STATUS_LABELS[status]}
              <span className="ml-2 rounded-full bg-background/90 px-2 py-0.5 text-xs text-foreground">
                {itemsByStatus[status].length}
              </span>
            </Button>
          ))}
        </div>

        <div
          className={cn(
            "flex snap-x snap-mandatory overflow-x-auto scroll-smooth pb-2 md:hidden touch-pan-x",
            isDragging && "snap-none overflow-x-hidden"
          )}
          onScroll={handleMobileBoardScroll}
        >
          {STATUSES.map((status) => (
            <div
              key={status}
              ref={(el) => {
                mobileColumnsRef.current[status] = el;
              }}
              className="min-w-full snap-start pr-2"
            >
              <KanbanColumn
                status={status}
                items={itemsByStatus[status]}
                canDrag={canEdit}
                onAddItem={canEdit ? openAddDialog : undefined}
                onEditItem={canEdit ? openEditDialog : undefined}
                onDeleteItem={canEdit ? setDeletingItem : undefined}
                onMoveItemForward={canEdit ? (itemId) => handleStepStatus(itemId, "forward") : undefined}
                onMoveItemBackward={canEdit ? (itemId) => handleStepStatus(itemId, "backward") : undefined}
                onOpenDrawer={setDrawerItem}
                usersMap={usersMap}
                className="w-full"
              />
            </div>
          ))}
        </div>

        <div className="hidden gap-4 overflow-x-auto pb-4 md:flex">
          {STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              items={itemsByStatus[status]}
              canDrag={canEdit}
              onAddItem={canEdit ? openAddDialog : undefined}
              onEditItem={canEdit ? openEditDialog : undefined}
              onDeleteItem={canEdit ? setDeletingItem : undefined}
              onMoveItemForward={canEdit ? (itemId) => handleStepStatus(itemId, "forward") : undefined}
              onMoveItemBackward={canEdit ? (itemId) => handleStepStatus(itemId, "backward") : undefined}
              onOpenDrawer={setDrawerItem}
              usersMap={usersMap}
            />
          ))}
        </div>

        <DragOverlay>
          {activeItem && (
            <KanbanCardOverlay
              item={activeItem}
              responsavelNome={activeItem.responsavel_id ? usersMap[activeItem.responsavel_id] : undefined}
            />
          )}
        </DragOverlay>
      </DndContext>

      {/* Dialog criar item */}
      <Dialog open={!!addingToStatus} onOpenChange={(o) => !o && setAddingToStatus(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmitCreate)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input placeholder="Ex: Instalar piso do hall" {...register("title")} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Descrição (opcional)</Label>
              <Input placeholder="Detalhes do item..." {...register("descricao")} />
            </div>
            {Object.keys(usersMap).length > 0 && (
              <div className="space-y-1.5">
                <Label>Responsável (opcional)</Label>
                <Select onValueChange={(v) => setValue("responsavel_id", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sem responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(usersMap).map(([id, nome]) => (
                      <SelectItem key={id} value={id}>{nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setAddingToStatus(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Criando..." : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog editar item */}
      <Dialog open={!!editingItem} onOpenChange={(o) => !o && setEditingItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmitEdit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input {...register("title")} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Descrição (opcional)</Label>
              <Input {...register("descricao")} />
            </div>
            {Object.keys(usersMap).length > 0 && (
              <div className="space-y-1.5">
                <Label>Responsável (opcional)</Label>
                <Select
                  defaultValue={editingItem?.responsavel_id}
                  onValueChange={(v) => setValue("responsavel_id", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sem responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(usersMap).map(([id, nome]) => (
                      <SelectItem key={id} value={id}>{nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setEditingItem(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmar exclusão */}
      <ConfirmDialog
        open={!!deletingItem}
        onOpenChange={(o) => !o && setDeletingItem(null)}
        title="Remover item"
        description={`Tem certeza que deseja remover "${deletingItem?.title}"?`}
        confirmLabel="Remover"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        loading={isDeleting}
      />

      {/* Drawer de detalhes do item */}
      <ItemDrawer
        item={drawerItem}
        obraId={obraId}
        usersMap={usersMap}
        onClose={() => setDrawerItem(null)}
      />
    </>
  );
}
