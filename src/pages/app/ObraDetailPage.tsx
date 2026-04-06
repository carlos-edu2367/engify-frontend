import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Trash2, MoreVertical, Link as LinkIcon, User, Calendar, Wallet, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageTransition } from "@/components/layout/PageTransition";
import { KanbanBoard } from "@/components/features/kanban/KanbanBoard";
import { MuralTab } from "@/components/features/mural/MuralTab";
import { DiariasTab } from "@/components/features/diarias/DiariasTab";
import { ImagensTab } from "@/components/features/imagens/ImagensTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { obrasService } from "@/services/obras.service";
import { itemsService } from "@/services/items.service";
import { usersService } from "@/services/users.service";
import { obraSchema, type ObraFormValues } from "@/lib/schemas/obra.schemas";
import { formatCurrency, formatDate, getApiErrorMessage } from "@/lib/utils";
import type { ObraStatus } from "@/types/obra.types";
import { useAuthStore } from "@/store/auth.store";

const statusLabels: Record<ObraStatus, string> = {
  planejamento: "Planejamento",
  em_andamento: "Em Andamento",
  finalizado: "Finalizado",
};

const statusVariants: Record<ObraStatus, "info" | "warning" | "success"> = {
  planejamento: "info",
  em_andamento: "warning",
  finalizado: "success",
};

export function ObraDetailPage() {
  const { obraId } = useParams<{ obraId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const canEdit = user?.role === "admin" || user?.role === "engenheiro";
  const [editOpen, setEditOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: obra, isLoading } = useQuery({
    queryKey: ["obras", obraId],
    queryFn: () => obrasService.get(obraId!),
    enabled: !!obraId,
  });

  const { data: items = [] } = useQuery({
    queryKey: ["obras", obraId, "items"],
    queryFn: () => itemsService.list(obraId!),
    enabled: !!obraId,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersService.list(),
    enabled: canEdit,
  });

  const usersMap = Object.fromEntries(
    users.map((u) => [u.user_id, u.nome])
  );

  const updateMutation = useMutation({
    mutationFn: (values: ObraFormValues) => obrasService.update(obraId!, values),
    onSuccess: (updated) => {
      queryClient.setQueryData(["obras", obraId], updated);
      queryClient.invalidateQueries({ queryKey: ["obras"] });
      toast.success("Obra atualizada com sucesso!");
      setEditOpen(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => obrasService.delete(obraId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obras"] });
      toast.success("Obra removida.");
      navigate("/obras");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const statusMutation = useMutation({
    mutationFn: (status: ObraStatus) => obrasService.updateStatus(obraId!, { status }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["obras", obraId], updated);
      toast.success("Status atualizado!");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ObraFormValues>({
    resolver: zodResolver(obraSchema),
  });

  function openEdit() {
    if (!obra) return;
    setValue("title", obra.title);
    setValue("responsavel_id", obra.responsavel_id);
    setValue("description", obra.description ?? "");
    if (obra.valor) setValue("valor", parseFloat(obra.valor));
    setEditOpen(true);
  }

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageTransition>
    );
  }

  if (!obra) return null;

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/obras")} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold truncate">{obra.title}</h1>
              <Badge variant={statusVariants[obra.status]}>{statusLabels[obra.status]}</Badge>
            </div>
            
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                {obra.responsavel_id && usersMap[obra.responsavel_id] && (
                    <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                        <User className="h-4 w-4" />
                        <span>Responsável: {usersMap[obra.responsavel_id]}</span>
                    </div>
                )}
                {obra.data_entrega && (
                    <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                        <Calendar className="h-4 w-4" />
                        <span>Prazo: {formatDate(obra.data_entrega)}</span>
                    </div>
                )}
                {obra.valor && (
                    <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                        <Wallet className="h-4 w-4" />
                        <span>Valor: {formatCurrency(obra.valor)}</span>
                    </div>
                )}
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            <RoleGuard roles={["admin", "engenheiro"]}>
              <Button variant="outline" size="sm" onClick={openEdit}>
                <Pencil className="h-4 w-4 mr-1" />
                Editar
              </Button>
            </RoleGuard>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <RoleGuard roles={["admin", "engenheiro"]}>
                  <DropdownMenuItem onClick={() => setStatusOpen(true)}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Atualizar status
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/obras/${obraId}/cliente`);
                      toast.success("Link copiado para a área de transferência");
                  }}>
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Copiar link do cliente
                  </DropdownMenuItem>
                </RoleGuard>
                
                <RoleGuard roles={["admin"]}>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:bg-destructive/10" onClick={() => setDeleteOpen(true)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir obra
                  </DropdownMenuItem>
                </RoleGuard>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Descrição */}
        {obra.description && (
          <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Descrição</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{obra.description}</p>
          </div>
        )}

        <Tabs defaultValue="kanban">
          <TabsList>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="mural">Mural</TabsTrigger>
            <TabsTrigger value="diarias">Diárias</TabsTrigger>
            <TabsTrigger value="imagens">Imagens</TabsTrigger>
          </TabsList>

          <TabsContent value="kanban" className="mt-4">
            <KanbanBoard
              obraId={obraId!}
              items={items}
              canEdit={canEdit}
              usersMap={usersMap}
            />
          </TabsContent>

          <TabsContent value="mural" className="mt-4">
            <MuralTab obraId={obraId!} />
          </TabsContent>

          <TabsContent value="diarias" className="mt-4">
            <DiariasTab obraId={obraId!} />
          </TabsContent>

          <TabsContent value="imagens" className="mt-4">
            <ImagensTab obraId={obraId!} canEdit={canEdit} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog editar obra */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar obra</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((v) => updateMutation.mutate(v))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input {...register("title")} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Responsável</Label>
              <Select onValueChange={(v) => setValue("responsavel_id", v)} defaultValue={obra.responsavel_id}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.user_id} value={u.user_id}>
                      {u.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Descrição (opcional)</Label>
              <Input {...register("description")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Valor (opcional)</Label>
                <Input placeholder="150000.00" {...register("valor")} />
              </div>
              <div className="space-y-1.5">
                <Label>Data de entrega (opcional)</Label>
                <Input type="date" {...register("data_entrega")} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setEditOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog atualizar status */}
      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Atualizar Status</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Select
              value={obra.status}
              onValueChange={(v) => {
                statusMutation.mutate(v as ObraStatus);
                setStatusOpen(false);
              }}
              disabled={statusMutation.isPending}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planejamento">Planejamento</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="finalizado">Finalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmar exclusão */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Remover obra"
        description={`Remover "${obra.title}"? Os dados serão preservados mas a obra não aparecerá mais nas listagens.`}
        confirmLabel="Remover"
        variant="destructive"
        onConfirm={() => deleteMutation.mutate()}
        loading={deleteMutation.isPending}
      />
    </PageTransition>
  );
}
