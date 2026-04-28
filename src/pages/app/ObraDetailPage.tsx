import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Trash2, MoreVertical, Link as LinkIcon, User, Calendar, Wallet, CheckCircle, TrendingDown, Plus, Paperclip } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageTransition } from "@/components/layout/PageTransition";
import { KanbanBoard } from "@/components/features/kanban/KanbanBoard";
import { MuralTab } from "@/components/features/mural/MuralTab";
import { DiariasTab } from "@/components/features/diarias/DiariasTab";
import { ImagensTab } from "@/components/features/imagens/ImagensTab";
import { PagamentosTab } from "@/components/features/pagamentos/PagamentosTab";
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
import { useRegistrarRecebimento, useObraEntradas } from "@/hooks/useObras";
import { EntradaAnexosSheet } from "@/components/features/financeiro/EntradaAnexosSheet";
import type { ObraEntradaResponse } from "@/types/obra.types";
import { itemsService } from "@/services/items.service";
import { usersService } from "@/services/users.service";
import { CategoriaObraSelect } from "@/components/features/categorias/CategoriaObraSelect";
import { useAllCategoriasObras } from "@/hooks/useCategoriasObras";
import { obraSchema, type ObraFormValues } from "@/lib/schemas/obra.schemas";
import { formatCurrency, formatDate, getApiErrorMessage } from "@/lib/utils";
import type { ObraStatus } from "@/types/obra.types";
import { useAuthStore } from "@/store/auth.store";

const statusLabels: Record<ObraStatus, string> = {
  planejamento: "Planejamento",
  em_andamento: "Em Andamento",
  financeiro: "Financeiro",
  finalizado: "Finalizado",
};

const statusVariants: Record<ObraStatus, "info" | "warning" | "success" | "secondary"> = {
  planejamento: "info",
  em_andamento: "warning",
  financeiro: "success",
  finalizado: "secondary",
};

export function ObraDetailPage() {
  const { obraId } = useParams<{ obraId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") ?? "kanban";
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const canEdit = user?.role === "admin" || user?.role === "engenheiro";
  const [editOpen, setEditOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [recebimentoOpen, setRecebimentoOpen] = useState(false);
  const [recebimentoValor, setRecebimentoValor] = useState("");
  const [selectedEntrada, setSelectedEntrada] = useState<ObraEntradaResponse | null>(null);

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

  const { data: categoriasData } = useAllCategoriasObras();
  const categoriasMap = Object.fromEntries(
    (categoriasData?.items ?? []).map((c) => [c.id, c])
  );

  const usersMap = Object.fromEntries(users.map((u) => [u.user_id, u.nome]));

  const updateMutation = useMutation({
    mutationFn: (values: ObraFormValues) =>
      obrasService.update(obraId!, {
        ...values,
        categoria_id: values.categoria_id ?? null,
        remove_categoria: values.categoria_id === null,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["obras", obraId], updated);
      queryClient.invalidateQueries({ queryKey: ["obras"] });
      queryClient.invalidateQueries({ queryKey: ["obras", "by-categoria"] });
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

  const recebimentoMutation = useRegistrarRecebimento(obraId);
  const { data: entradasData } = useObraEntradas(obraId);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
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
    setValue("categoria_id", obra.categoria_id ?? null);
    setEditOpen(true);
  }

  function handleCopyClientLink() {
    navigator.clipboard.writeText(`${window.location.origin}/obras/${obraId}/cliente`);
    toast.success("Link copiado para a area de transferencia");
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
        <div className="flex items-start gap-3 sm:gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/obras")} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="truncate text-xl font-bold sm:text-2xl">{obra.title}</h1>
              <Badge variant={statusVariants[obra.status]}>{statusLabels[obra.status]}</Badge>
              {obra.categoria_id && categoriasMap[obra.categoria_id] && (
                <div
                  className="flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-2.5 py-0.5"
                  title={categoriasMap[obra.categoria_id].title}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: categoriasMap[obra.categoria_id].cor ?? "#64748b",
                    }}
                  />
                  <span className="text-xs font-medium text-muted-foreground">
                    {categoriasMap[obra.categoria_id].title}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {obra.responsavel_id && usersMap[obra.responsavel_id] && (
                <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="text-sm font-medium">Responsavel: {usersMap[obra.responsavel_id]}</span>
                </div>
              )}
              {obra.data_entrega && (
                <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-medium">Prazo: {formatDate(obra.data_entrega)}</span>
                </div>
              )}
              {obra.valor && (
                <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-muted-foreground">
                  <Wallet className="h-4 w-4" />
                  <span className="text-sm font-medium">Valor: {formatCurrency(obra.valor)}</span>
                </div>
              )}
              {obra.total_recebido !== undefined && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-emerald-700 dark:text-emerald-400">
                  <TrendingDown className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Recebido: {formatCurrency(obra.total_recebido)}
                    {obra.valor && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({Math.round((parseFloat(obra.total_recebido) / parseFloat(obra.valor)) * 100)}%)
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="hidden shrink-0 gap-2 md:flex">
            <RoleGuard roles={["admin", "engenheiro"]}>
              <Button variant="outline" size="sm" onClick={openEdit}>
                <Pencil className="mr-1 h-4 w-4" />
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
                <RoleGuard roles={["admin", "engenheiro", "financeiro"]}>
                  <DropdownMenuItem onClick={() => setStatusOpen(true)}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Atualizar status
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopyClientLink}>
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Copiar link do cliente
                  </DropdownMenuItem>
                </RoleGuard>

                <RoleGuard roles={["admin"]}>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:bg-destructive/10" onClick={() => setDeleteOpen(true)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir obra
                  </DropdownMenuItem>
                </RoleGuard>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex gap-2 md:hidden">
          <RoleGuard roles={["admin", "engenheiro"]}>
            <Button variant="outline" className="h-11 flex-1" onClick={openEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar obra
            </Button>
          </RoleGuard>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-11 w-11 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <RoleGuard roles={["admin", "engenheiro", "financeiro"]}>
                <DropdownMenuItem onClick={() => setStatusOpen(true)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Atualizar status
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyClientLink}>
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Copiar link do cliente
                </DropdownMenuItem>
              </RoleGuard>

              <RoleGuard roles={["admin"]}>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:bg-destructive/10" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir obra
                </DropdownMenuItem>
              </RoleGuard>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {obra.description && (
          <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Descricao</p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{obra.description}</p>
          </div>
        )}

        <Tabs defaultValue={initialTab}>
          <TabsList className="overflow-x-auto whitespace-nowrap">
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="mural">Mural</TabsTrigger>
            <TabsTrigger value="diarias">Diarias</TabsTrigger>
            <TabsTrigger value="imagens">Imagens</TabsTrigger>
            <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
            <TabsTrigger value="recebimentos">Recebimentos</TabsTrigger>
          </TabsList>

          <TabsContent value="kanban" className="mt-4">
            <KanbanBoard obraId={obraId!} items={items} canEdit={canEdit} usersMap={usersMap} />
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

          <TabsContent value="pagamentos" className="mt-4">
            <PagamentosTab obraId={obraId!} />
          </TabsContent>

          <TabsContent value="recebimentos" className="mt-4 space-y-4">
            {/* Resumo */}
            {obra.valor && (
              <div className="rounded-lg border border-border/60 bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Progresso de Recebimento</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatCurrency(obra.total_recebido ?? "0")} de {formatCurrency(obra.valor)}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {Math.min(100, Math.round((parseFloat(obra.total_recebido ?? "0") / parseFloat(obra.valor)) * 100))}%
                  </p>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5">
                  <div
                    className="bg-emerald-500 h-2.5 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, Math.round((parseFloat(obra.total_recebido ?? "0") / parseFloat(obra.valor)) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {!obra.valor && obra.total_recebido !== undefined && (
              <div className="rounded-lg border border-border/60 bg-card p-4">
                <p className="text-sm font-medium">Total Recebido</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatCurrency(obra.total_recebido)}
                </p>
              </div>
            )}

            {/* Botão registrar */}
            <RoleGuard roles={["admin", "engenheiro"]}>
              <div className="flex justify-end">
                <Button size="sm" onClick={() => { setRecebimentoValor(""); setRecebimentoOpen(true); }}>
                  <Plus className="h-4 w-4 mr-1" />
                  Registrar Recebimento
                </Button>
              </div>
            </RoleGuard>

            {/* Lista de entradas */}
            <div className="space-y-2">
              {(entradasData?.items ?? []).length === 0 ? (
                <div className="py-10 text-center border rounded-lg bg-card text-muted-foreground text-sm">
                  Nenhum recebimento registrado ainda.
                </div>
              ) : (
                (entradasData?.items ?? []).map((entrada) => (
                  <button
                    key={entrada.id}
                    onClick={() => setSelectedEntrada(entrada)}
                    className="w-full flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-card px-4 py-3 text-left hover:border-primary/40 hover:shadow-sm transition-all"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{entrada.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(entrada.data_movimentacao)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <p className="font-bold text-emerald-600 dark:text-emerald-400">+{formatCurrency(entrada.valor)}</p>
                      <Paperclip className="h-3.5 w-3.5 text-muted-foreground/50" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar obra</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((v) => updateMutation.mutate(v))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Titulo</Label>
              <Input {...register("title")} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Responsavel</Label>
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
              <Label>Categoria (opcional)</Label>
              <CategoriaObraSelect
                value={watch("categoria_id")}
                onValueChange={(v) => setValue("categoria_id", v)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Descricao (opcional)</Label>
              <Input {...register("description")} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                <SelectItem value="financeiro">Financeiro</SelectItem>
                <SelectItem
                  value="finalizado"
                  disabled={obra.status === "financeiro" && user?.role === "engenheiro"}
                  title={obra.status === "financeiro" && user?.role === "engenheiro" ? "Apenas Admin ou Financeiro podem finalizar" : ""}
                >
                  Finalizado
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Remover obra"
        description={`Remover "${obra.title}"? Os dados serao preservados mas a obra nao aparecera mais nas listagens.`}
        confirmLabel="Remover"
        variant="destructive"
        onConfirm={() => deleteMutation.mutate()}
        loading={deleteMutation.isPending}
      />

      <EntradaAnexosSheet
        entrada={selectedEntrada}
        onClose={() => setSelectedEntrada(null)}
        onDeleted={() => setSelectedEntrada(null)}
      />

      <Dialog open={recebimentoOpen} onOpenChange={setRecebimentoOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar Recebimento</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const valor = parseFloat(recebimentoValor);
              if (!valor || valor <= 0) {
                toast.error("Informe um valor positivo.");
                return;
              }
              recebimentoMutation.mutate(
                { valor },
                {
                  onSuccess: () => {
                    toast.success("Recebimento registrado!");
                    setRecebimentoOpen(false);
                  },
                  onError: (err) => toast.error(getApiErrorMessage(err)),
                }
              );
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label>Valor recebido *</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="5000.00"
                value={recebimentoValor}
                onChange={(e) => setRecebimentoValor(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setRecebimentoOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={recebimentoMutation.isPending}>
                {recebimentoMutation.isPending ? "Registrando..." : "Registrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
