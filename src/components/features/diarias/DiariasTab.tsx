import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, CalendarDays, Pencil, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, startOfYear, endOfDay, startOfDay, parseISO, formatISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { diariasService } from "@/services/diarias.service";
import { teamsService } from "@/services/teams.service";
import { diariaSchema, type DiariaFormValues } from "@/lib/schemas/diaria.schemas";
import { formatDate, getApiErrorMessage } from "@/lib/utils";
import type { DiariesResponse } from "@/types/diaria.types";

interface DiariasTabProps {
  obraId: string;
}

export function DiariasTab({ obraId }: DiariasTabProps) {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingDiaria, setEditingDiaria] = useState<DiariesResponse | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Busca todas as diárias num range amplo e filtra localmente pela obra
  const now = new Date();
  const startISO = formatISO(startOfDay(startOfYear(now)));
  const endISO = formatISO(endOfDay(now));

  const { data, isLoading } = useQuery({
    queryKey: ["diarias", { obra: obraId }],
    queryFn: () => diariasService.list({ start: startISO, end: endISO, limit: 100 }),
  });

  const diarias = (data?.items ?? []).filter((d) => d.obra_id === obraId);

  const { data: diaristasData } = useQuery({
    queryKey: ["diaristas"],
    queryFn: () => teamsService.getDiaristas(),
  });

  // ─── Create ──────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (values: DiariaFormValues) =>
      diariasService.create({
        ...values,
        obra_id: obraId,
        data: values.data ? formatISO(parseISO(values.data)) : undefined,
        data_pagamento: values.data_pagamento
          ? formatISO(parseISO(values.data_pagamento))
          : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diarias"] });
      toast.success("Diária registrada!");
      setCreateOpen(false);
      resetCreate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const {
    register: registerCreate,
    handleSubmit: handleCreate,
    setValue: setCreateValue,
    reset: resetCreate,
    formState: { errors: createErrors },
  } = useForm<DiariaFormValues>({
    resolver: zodResolver(diariaSchema),
    defaultValues: { obra_id: obraId },
  });

  // ─── Edit ──────────────────────────────────────────────
  const editMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: DiariaFormValues }) =>
      diariasService.update(id, {
        descricao_diaria: values.descricao_diaria,
        quantidade_diaria: values.quantidade_diaria,
        data: values.data ? formatISO(parseISO(values.data)) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diarias"] });
      toast.success("Diária atualizada!");
      setEditingDiaria(null);
      resetEdit();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const {
    register: registerEdit,
    handleSubmit: handleEdit,
    reset: resetEdit,
  } = useForm<DiariaFormValues>({
    resolver: zodResolver(diariaSchema),
    defaultValues: { obra_id: obraId },
  });

  function openEdit(d: DiariesResponse) {
    resetEdit({
      diarista_id: d.diarist_id,
      obra_id: obraId,
      descricao_diaria: d.descricao_diaria ?? "",
      quantidade_diaria: d.quantidade,
      data: d.data ? format(new Date(d.data), "yyyy-MM-dd") : "",
    });
    setEditingDiaria(d);
  }

  // ─── Delete ──────────────────────────────────────────────
  async function handleDeleteConfirm() {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await diariasService.delete(deletingId);
      queryClient.invalidateQueries({ queryKey: ["diarias"] });
      toast.success("Diária removida.");
      setDeletingId(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header da aba */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {diarias.length} diária{diarias.length !== 1 ? "s" : ""} registrada{diarias.length !== 1 ? "s" : ""} nesta obra
          </p>
        </div>
        <RoleGuard roles={["admin", "engenheiro"]}>
          <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Registrar
          </Button>
        </RoleGuard>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : diarias.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center mb-3">
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Nenhuma diária registrada</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Registre as diárias de diaristas que trabalharam nesta obra.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {diarias.map((d) => (
            <Card key={d.id} className="border-border/50 shadow-sm">
              <CardContent className="flex items-center gap-4 py-4">
                {/* Ícone */}
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <CalendarDays className="h-4 w-4 text-primary" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{d.diarist_name}</p>
                  {d.descricao_diaria && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{d.descricao_diaria}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(d.data)} · {d.quantidade}x
                  </p>
                </div>

                {/* Ações */}
                <RoleGuard roles={["admin", "engenheiro"]}>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(d)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingId(d.id)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Remover"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </RoleGuard>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal registrar */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Diária</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate((v) => createMutation.mutate(v))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Diarista *</Label>
              <Select onValueChange={(v) => setCreateValue("diarista_id", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o diarista..." />
                </SelectTrigger>
                <SelectContent>
                  {(diaristasData?.items ?? []).map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {createErrors.diarista_id && (
                <p className="text-xs text-destructive">{createErrors.diarista_id.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0.5"
                  defaultValue={1}
                  {...registerCreate("quantidade_diaria")}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Data do serviço</Label>
                <Input type="date" {...registerCreate("data")} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Data de pagamento (opcional)</Label>
              <Input type="date" {...registerCreate("data_pagamento")} />
            </div>

            <div className="space-y-1.5">
              <Label>Descrição (opcional)</Label>
              <Input placeholder="Ex: Serviço de alvenaria" {...registerCreate("descricao_diaria")} />
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Registrando..." : "Registrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal editar */}
      <Dialog open={!!editingDiaria} onOpenChange={(o) => !o && setEditingDiaria(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Diária</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleEdit((v) =>
              editMutation.mutate({ id: editingDiaria!.id, values: v })
            )}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Quantidade</Label>
                <Input type="number" step="0.5" min="0.5" {...registerEdit("quantidade_diaria")} />
              </div>
              <div className="space-y-1.5">
                <Label>Data</Label>
                <Input type="date" {...registerEdit("data")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Input {...registerEdit("descricao_diaria")} />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setEditingDiaria(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={editMutation.isPending}>
                {editMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm delete */}
      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(o) => !o && setDeletingId(null)}
        title="Remover diária"
        description="Tem certeza que deseja remover esta diária? O pagamento agendado associado também pode ser afetado."
        confirmLabel="Remover"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        loading={isDeleting}
      />
    </div>
  );
}
