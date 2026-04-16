import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, HardHat } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageTransition } from "@/components/layout/PageTransition";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/EmptyState";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { CategoriasTab } from "@/components/features/categorias/CategoriasTab";
import { CategoriaObraSelect } from "@/components/features/categorias/CategoriaObraSelect";
import { obrasService } from "@/services/obras.service";
import { usersService } from "@/services/users.service";
import { useAllCategoriasObras, useObrasByCategoria } from "@/hooks/useCategoriasObras";
import { obraSchema, type ObraFormValues } from "@/lib/schemas/obra.schemas";
import { formatISO, parseISO } from "date-fns";
import { formatCurrency, formatDate, getApiErrorMessage } from "@/lib/utils";
import type { ObraStatus } from "@/types/obra.types";
import { useAuthStore } from "@/store/auth.store";

type FilterStatus = ObraStatus | "all";

const statusVariants: Record<ObraStatus, "info" | "warning" | "success"> = {
  planejamento: "info",
  em_andamento: "warning",
  finalizado: "success",
};

const statusLabels: Record<ObraStatus, string> = {
  planejamento: "Planejamento",
  em_andamento: "Em Andamento",
  finalizado: "Finalizado",
};

const NO_CATEGORIA = "__all__";

export function ObrasPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const canManageObras = user?.role === "admin" || user?.role === "engenheiro";

  const [filter, setFilter] = useState<FilterStatus>("all");
  const [categoriaFilter, setCategoriaFilter] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // ── Queries ────────────────────────────────────────────────────────────────
  // Lista normal (sem filtro de categoria)
  const { data: obrasData, isLoading: obrasLoading } = useQuery({
    queryKey: ["obras", { status: filter }],
    queryFn: () => obrasService.list({ status: filter, limit: 50 }),
    enabled: !categoriaFilter,
  });

  // Lista filtrada por categoria
  const { data: obrasCatData, isLoading: obrasCatLoading } = useObrasByCategoria(
    categoriaFilter,
    { limit: 50 }
  );

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersService.list(),
    enabled: canManageObras,
  });

  // Mapa de categorias para lookup de cor nos cards
  const { data: categoriasData } = useAllCategoriasObras();
  const categoriasMap = Object.fromEntries(
    (categoriasData?.items ?? []).map((c) => [c.id, c])
  );

  const obras = categoriaFilter
    ? (obrasCatData?.items ?? [])
    : (obrasData?.items ?? []);
  const total = categoriaFilter
    ? (obrasCatData?.total ?? 0)
    : (obrasData?.total ?? 0);
  const isLoading = categoriaFilter ? obrasCatLoading : obrasLoading;

  // ── Criar obra ─────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (values: ObraFormValues) =>
      obrasService.create({
        ...values,
        data_entrega: values.data_entrega
          ? formatISO(parseISO(values.data_entrega))
          : undefined,
        categoria_id: values.categoria_id ?? null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obras"] });
      queryClient.invalidateQueries({ queryKey: ["obras", "by-categoria"] });
      toast.success("Obra criada com sucesso!");
      setCreateOpen(false);
      reset();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ObraFormValues>({ resolver: zodResolver(obraSchema) });

  const filterButtons: { value: FilterStatus; label: string }[] = [
    { value: "all", label: "Todas" },
    { value: "planejamento", label: "Planejamento" },
    { value: "em_andamento", label: "Em Andamento" },
    { value: "finalizado", label: "Finalizado" },
  ];

  function handleCategoriaFilter(v: string) {
    if (v === NO_CATEGORIA) {
      setCategoriaFilter(null);
    } else {
      setCategoriaFilter(v);
      setFilter("all"); // reset status filter quando categoria selecionada
    }
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Obras</h1>
        </div>

        <Tabs defaultValue="obras">
          <TabsList>
            <TabsTrigger value="obras">Obras</TabsTrigger>
            <RoleGuard roles={["admin", "engenheiro"]}>
              <TabsTrigger value="categorias">Categorias</TabsTrigger>
            </RoleGuard>
          </TabsList>

          {/* ── Aba Obras ───────────────────────────────────────────────────── */}
          <TabsContent value="obras" className="mt-4 space-y-4">
            {/* Controles: status + categoria + botão nova obra */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {total} obra{total !== 1 ? "s" : ""} encontrada{total !== 1 ? "s" : ""}
              </p>
              <RoleGuard roles={["admin", "engenheiro"]}>
                <Button onClick={() => setCreateOpen(true)} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-1" />
                  Nova Obra
                </Button>
              </RoleGuard>
            </div>

            {/* Filtros */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Status — desabilitado quando categoria selecionada */}
              <div className="-mx-1 overflow-x-auto px-1 pb-1 sm:pb-0">
                <div className="flex w-max snap-x gap-2 sm:flex-wrap">
                  {filterButtons.map((btn) => (
                    <Button
                      key={btn.value}
                      variant={
                        !categoriaFilter && filter === btn.value ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => {
                        setCategoriaFilter(null);
                        setFilter(btn.value);
                      }}
                      className="h-10 snap-start px-4"
                    >
                      {btn.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Filtro por categoria */}
              <div className="w-full sm:w-52">
                <Select
                  value={categoriaFilter ?? NO_CATEGORIA}
                  onValueChange={handleCategoriaFilter}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue>
                      {categoriaFilter && categoriasMap[categoriaFilter] ? (
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{
                              backgroundColor:
                                categoriasMap[categoriaFilter]?.cor ?? "#64748b",
                            }}
                          />
                          <span className="truncate">
                            {categoriasMap[categoriaFilter]?.title}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Categoria</span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_CATEGORIA}>
                      <span className="text-muted-foreground">Todas as categorias</span>
                    </SelectItem>
                    {(categoriasData?.items ?? []).map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: cat.cor ?? "#64748b" }}
                          />
                          {cat.title}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Grid de obras */}
            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-40" />
                ))}
              </div>
            ) : obras.length === 0 ? (
              <EmptyState
                icon={<HardHat className="h-10 w-10" />}
                title="Nenhuma obra encontrada"
                description={
                  categoriaFilter
                    ? "Nenhuma obra nesta categoria."
                    : "Crie uma nova obra para começar."
                }
                action={
                  !categoriaFilter ? (
                    <RoleGuard roles={["admin", "engenheiro"]}>
                      <Button size="sm" onClick={() => setCreateOpen(true)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Nova Obra
                      </Button>
                    </RoleGuard>
                  ) : undefined
                }
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {obras.map((obra) => {
                  const categoria = obra.categoria_id
                    ? categoriasMap[obra.categoria_id]
                    : null;
                  return (
                    <Card
                      key={obra.id}
                      className="cursor-pointer transition-shadow hover:shadow-md"
                      onClick={() => navigate(`/obras/${obra.id}`)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            {/* Bolinha de categoria */}
                            {categoria && (
                              <span
                                title={categoria.title}
                                className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: categoria.cor ?? "#64748b" }}
                              />
                            )}
                            <CardTitle className="truncate text-base leading-tight">
                              {obra.title}
                            </CardTitle>
                          </div>
                          <Badge
                            variant={statusVariants[obra.status]}
                            className="shrink-0"
                          >
                            {statusLabels[obra.status]}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {obra.valor && (
                          <div className="space-y-1">
                            <p className="text-sm font-semibold">
                              {formatCurrency(obra.valor)}
                            </p>
                            {obra.total_recebido !== undefined && (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs text-muted-foreground">
                                    Recebido: {formatCurrency(obra.total_recebido)}
                                  </p>
                                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                    {Math.min(100, Math.round((parseFloat(obra.total_recebido) / parseFloat(obra.valor)) * 100))}%
                                  </p>
                                </div>
                                <div className="w-full bg-muted rounded-full h-1.5">
                                  <div
                                    className="bg-emerald-500 h-1.5 rounded-full"
                                    style={{
                                      width: `${Math.min(100, Math.round((parseFloat(obra.total_recebido) / parseFloat(obra.valor)) * 100))}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        {!obra.valor && obra.total_recebido !== undefined && (
                          <p className="text-xs text-emerald-600 dark:text-emerald-400">
                            Recebido: {formatCurrency(obra.total_recebido)}
                          </p>
                        )}
                        {obra.data_entrega && (
                          <p className="text-xs text-muted-foreground">
                            Entrega: {formatDate(obra.data_entrega)}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Criada em {formatDate(obra.created_date)}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ── Aba Categorias ──────────────────────────────────────────────── */}
          <TabsContent value="categorias" className="mt-4">
            <CategoriasTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog — Criar obra */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Obra</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((v) => createMutation.mutate(v))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Título *</Label>
              <Input placeholder="Ex: Reforma Sede" {...register("title")} />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Responsável *</Label>
              <Select onValueChange={(v) => setValue("responsavel_id", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um usuário..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.user_id} value={u.user_id}>
                      {u.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.responsavel_id && (
                <p className="text-xs text-destructive">
                  {errors.responsavel_id.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Categoria (opcional)</Label>
              <CategoriaObraSelect
                value={watch("categoria_id")}
                onValueChange={(v) => setValue("categoria_id", v)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição (opcional)</Label>
              <Textarea
                placeholder="Descreva a obra..."
                rows={3}
                className="resize-none"
                {...register("description")}
              />
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
    </PageTransition>
  );
}
