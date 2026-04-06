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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { obrasService } from "@/services/obras.service";
import { usersService } from "@/services/users.service";
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

export function ObrasPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const canManageObras = user?.role === "admin" || user?.role === "engenheiro";
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["obras", { status: filter }],
    queryFn: () => obrasService.list({ status: filter, limit: 50 }),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersService.list(),
    enabled: canManageObras,
  });

  const createMutation = useMutation({
    mutationFn: (values: ObraFormValues) =>
      obrasService.create({
        ...values,
        valor: values.valor,
        data_entrega: values.data_entrega
          ? formatISO(parseISO(values.data_entrega))
          : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obras"] });
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
    reset,
    formState: { errors },
  } = useForm<ObraFormValues>({ resolver: zodResolver(obraSchema) });

  const obras = data?.items ?? [];

  const filterButtons: { value: FilterStatus; label: string }[] = [
    { value: "all", label: "Todas" },
    { value: "planejamento", label: "Planejamento" },
    { value: "em_andamento", label: "Em Andamento" },
    { value: "finalizado", label: "Finalizado" },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Obras</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {data?.total ?? 0} obra{data?.total !== 1 ? "s" : ""} encontrada{data?.total !== 1 ? "s" : ""}
            </p>
          </div>
          <RoleGuard roles={["admin", "engenheiro"]}>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Nova Obra
            </Button>
          </RoleGuard>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 flex-wrap">
          {filterButtons.map((btn) => (
            <Button
              key={btn.value}
              variant={filter === btn.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(btn.value)}
            >
              {btn.label}
            </Button>
          ))}
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
            description="Crie uma nova obra para começar a gerenciar suas atividades."
            action={
              <RoleGuard roles={["admin", "engenheiro"]}>
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Nova Obra
                </Button>
              </RoleGuard>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {obras.map((obra) => (
              <Card
                key={obra.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/obras/${obra.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-tight">{obra.title}</CardTitle>
                    <Badge variant={statusVariants[obra.status]} className="shrink-0">
                      {statusLabels[obra.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {obra.valor && (
                    <p className="text-sm font-semibold">{formatCurrency(obra.valor)}</p>
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
            ))}
          </div>
        )}
      </div>

      {/* Dialog criar obra */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Obra</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((v) => createMutation.mutate(v))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Título *</Label>
              <Input placeholder="Ex: Reforma Sede" {...register("title")} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
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
                <p className="text-xs text-destructive">{errors.responsavel_id.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Descrição (opcional)</Label>
              <Input placeholder="Descreva a obra..." {...register("description")} />
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
