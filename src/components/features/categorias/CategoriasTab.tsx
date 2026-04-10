import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { CategoriaColorPicker } from "./CategoriaColorPicker";
import {
  useCategoriasObrasList,
  useCreateCategoriaObra,
  useUpdateCategoriaObra,
  useDeleteCategoriaObra,
} from "@/hooks/useCategoriasObras";
import { categoriaObraSchema, type CategoriaObraFormValues } from "@/lib/schemas/categoria-obra.schemas";
import { getApiErrorMessage } from "@/lib/utils";
import type { CategoriaObraListItem } from "@/types/categoria-obra.types";

export function CategoriasTab() {
  const { data, isLoading } = useCategoriasObrasList({ limit: 100 });
  const categorias = data?.items ?? [];

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CategoriaObraListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoriaObraListItem | null>(null);

  const createMutation = useCreateCategoriaObra();
  const updateMutation = useUpdateCategoriaObra(editTarget?.id);
  const deleteMutation = useDeleteCategoriaObra();

  // ── Formulário de criação ────────────────────────────────────────────────
  const createForm = useForm<CategoriaObraFormValues>({
    resolver: zodResolver(categoriaObraSchema),
    defaultValues: { title: "", descricao: "", cor: "#3b82f6" },
  });

  function handleCreate(values: CategoriaObraFormValues) {
    createMutation.mutate(
      { title: values.title, descricao: values.descricao || undefined, cor: values.cor || undefined },
      {
        onSuccess: () => {
          toast.success("Categoria criada!");
          setCreateOpen(false);
          createForm.reset({ title: "", descricao: "", cor: "#3b82f6" });
        },
        onError: (err) => toast.error(getApiErrorMessage(err)),
      }
    );
  }

  // ── Formulário de edição ─────────────────────────────────────────────────
  const editForm = useForm<CategoriaObraFormValues>({
    resolver: zodResolver(categoriaObraSchema),
  });

  function openEdit(cat: CategoriaObraListItem) {
    setEditTarget(cat);
    editForm.reset({ title: cat.title, descricao: cat.descricao ?? "", cor: cat.cor ?? "" });
  }

  function handleEdit(values: CategoriaObraFormValues) {
    if (!editTarget) return;
    updateMutation.mutate(
      { title: values.title, descricao: values.descricao || undefined, cor: values.cor || undefined },
      {
        onSuccess: () => {
          toast.success("Categoria atualizada!");
          setEditTarget(null);
        },
        onError: (err) => toast.error(getApiErrorMessage(err)),
      }
    );
  }

  // ── Exclusão ────────────────────────────────────────────────────────────
  function handleDelete() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Categoria removida.");
        setDeleteTarget(null);
      },
      onError: (err) => toast.error(getApiErrorMessage(err)),
    });
  }

  return (
    <div className="space-y-4">
      {/* Header da aba */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {data?.total ?? 0} categoria{data?.total !== 1 ? "s" : ""}
        </p>
        <RoleGuard roles={["admin", "engenheiro"]}>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Nova categoria
          </Button>
        </RoleGuard>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : categorias.length === 0 ? (
        <EmptyState
          icon={<Tag className="h-10 w-10" />}
          title="Nenhuma categoria criada"
          description="Crie categorias para organizar suas obras."
          action={
            <RoleGuard roles={["admin", "engenheiro"]}>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-1 h-4 w-4" />
                Nova categoria
              </Button>
            </RoleGuard>
          }
        />
      ) : (
        <div className="space-y-2">
          {categorias.map((cat) => (
            <Card key={cat.id} className="transition-shadow hover:shadow-sm">
              <CardContent className="flex items-center gap-3 px-4 py-3">
                {/* Bolinha de cor */}
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: cat.cor ?? "#64748b" }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{cat.title}</p>
                  {cat.descricao && (
                    <p className="truncate text-xs text-muted-foreground">{cat.descricao}</p>
                  )}
                </div>
                <RoleGuard roles={["admin", "engenheiro"]}>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(cat)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <RoleGuard roles={["admin"]}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(cat)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </RoleGuard>
                  </div>
                </RoleGuard>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog — Criar */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova categoria</DialogTitle>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input placeholder="Ex: Residencial" {...createForm.register("title")} />
              {createForm.formState.errors.title && (
                <p className="text-xs text-destructive">
                  {createForm.formState.errors.title.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Descrição (opcional)</Label>
              <Input
                placeholder="Descreva a categoria..."
                {...createForm.register("descricao")}
              />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <CategoriaColorPicker
                value={createForm.watch("cor")}
                onChange={(cor) => createForm.setValue("cor", cor)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Criando..." : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog — Editar */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar categoria</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input {...editForm.register("title")} />
              {editForm.formState.errors.title && (
                <p className="text-xs text-destructive">
                  {editForm.formState.errors.title.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Descrição (opcional)</Label>
              <Input {...editForm.register("descricao")} />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <CategoriaColorPicker
                value={editForm.watch("cor")}
                onChange={(cor) => editForm.setValue("cor", cor)}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setEditTarget(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm — Excluir */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Remover categoria"
        description={`Remover "${deleteTarget?.title}"? As obras desta categoria ficarão sem categoria atribuída.`}
        confirmLabel="Remover"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
