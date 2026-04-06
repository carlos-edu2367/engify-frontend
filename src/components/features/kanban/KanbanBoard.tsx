import { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ItemResponse, ItemStatus } from "@/types/item.types";
import { itemsService } from "@/services/items.service";
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
import { getApiErrorMessage } from "@/lib/utils";

const STATUSES: ItemStatus[] = ["planejamento", "em_andamento", "finalizado"];

interface KanbanBoardProps {
  obraId: string;
  items: ItemResponse[];
  canEdit: boolean;
  usersMap?: Record<string, string>;
}

export function KanbanBoard({ obraId, items, canEdit, usersMap = {} }: KanbanBoardProps) {
  const queryClient = useQueryClient();
  const [activeItem, setActiveItem] = useState<ItemResponse | null>(null);
  const [addingToStatus, setAddingToStatus] = useState<ItemStatus | null>(null);
  const [editingItem, setEditingItem] = useState<ItemResponse | null>(null);
  const [deletingItem, setDeletingItem] = useState<ItemResponse | null>(null);
  const [drawerItem, setDrawerItem] = useState<ItemResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Agrupa items por status
  const itemsByStatus = useMemo(() => {
    const map: Record<ItemStatus, ItemResponse[]> = {
      planejamento: [],
      em_andamento: [],
      finalizado: [],
    };
    for (const item of items) {
      if (map[item.status]) map[item.status].push(item);
    }
    return map;
  }, [items]);

  function handleDragStart(event: DragStartEvent) {
    const item = items.find((i) => i.id === event.active.id);
    setActiveItem(item ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
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

    const activeItem = items.find((i) => i.id === activeId);
    if (!activeItem) return;

    if (activeItem.status === targetStatus && activeId === overId) return;

    // Optimistic update
    queryClient.setQueryData<ItemResponse[]>(["obras", obraId, "items"], (old = []) => {
      const updated = old.map((i) =>
        i.id === activeId ? { ...i, status: targetStatus } : i
      );
      // Reordena dentro da mesma coluna
      if (activeItem.status === targetStatus) {
        const columnItems = updated.filter((i) => i.status === targetStatus);
        const oldIndex = columnItems.findIndex((i) => i.id === activeId);
        const newIndex = columnItems.findIndex((i) => i.id === overId);
        if (oldIndex !== -1 && newIndex !== -1) {
          const reordered = arrayMove(columnItems, oldIndex, newIndex);
          return updated.map((i) =>
            i.status === targetStatus
              ? reordered.find((r) => r.id === i.id) ?? i
              : i
          );
        }
      }
      return updated;
    });

    // Persiste na API
    itemsService.update(obraId, activeId, { status: targetStatus }).catch(() => {
      toast.error("Erro ao mover item. Revertendo...");
      queryClient.invalidateQueries({ queryKey: ["obras", obraId, "items"] });
    });
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
      setDeletingItem(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUSES.map((status) => (
          <KanbanColumn
              key={status}
              status={status}
              items={itemsByStatus[status]}
              canDrag={canEdit}
              onAddItem={canEdit ? openAddDialog : undefined}
              onEditItem={canEdit ? openEditDialog : undefined}
              onDeleteItem={canEdit ? setDeletingItem : undefined}
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
