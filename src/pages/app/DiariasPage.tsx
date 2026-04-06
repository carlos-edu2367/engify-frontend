import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, CalendarDays } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, startOfMonth, endOfDay, startOfDay, parseISO, formatISO } from "date-fns";
import { PageTransition } from "@/components/layout/PageTransition";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { diariasService } from "@/services/diarias.service";
import { teamsService } from "@/services/teams.service";
import { obrasService } from "@/services/obras.service";
import { diariaSchema, type DiariaFormValues } from "@/lib/schemas/diaria.schemas";
import { formatDate, getApiErrorMessage } from "@/lib/utils";

export function DiariasPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const now = new Date();
  const [start, setStart] = useState(format(startOfMonth(now), "yyyy-MM-dd"));
  const [end, setEnd] = useState(format(endOfDay(now), "yyyy-MM-dd"));

  const startISO = formatISO(startOfDay(parseISO(start)));
  const endISO = formatISO(endOfDay(parseISO(end)));

  const { data, isLoading } = useQuery({
    queryKey: ["diarias", { start: startISO, end: endISO }],
    queryFn: () => diariasService.list({ start: startISO, end: endISO, limit: 50 }),
  });

  const { data: diaristasData } = useQuery({
    queryKey: ["diaristas"],
    queryFn: () => teamsService.getDiaristas(),
  });

  const { data: obrasData } = useQuery({
    queryKey: ["obras", { status: "em_andamento" }],
    queryFn: () => obrasService.list({ status: "em_andamento", limit: 50 }),
  });

  const createMutation = useMutation({
    mutationFn: (values: DiariaFormValues) =>
      diariasService.create({
        ...values,
        data: values.data ? formatISO(parseISO(values.data)) : undefined,
        data_pagamento: values.data_pagamento
          ? formatISO(parseISO(values.data_pagamento))
          : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diarias"] });
      toast.success("Diária registrada com sucesso!");
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
  } = useForm<DiariaFormValues>({ resolver: zodResolver(diariaSchema) });

  const diarias = data?.items ?? [];

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Diárias</h1>
            <p className="text-sm text-muted-foreground">
              {data?.total ?? 0} diária{data?.total !== 1 ? "s" : ""} no período
            </p>
          </div>
          <RoleGuard roles={["admin", "engenheiro"]}>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Registrar Diária
            </Button>
          </RoleGuard>
        </div>

        {/* Filtro de período */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Label className="shrink-0">De:</Label>
            <Input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="shrink-0">Até:</Label>
            <Input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-40"
            />
          </div>
        </div>

        {/* Lista */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : diarias.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="h-10 w-10" />}
            title="Nenhuma diária no período"
            description="Ajuste o filtro de datas ou registre uma nova diária."
          />
        ) : (
          <div className="space-y-2">
            {diarias.map((d) => (
              <Card key={d.id}>
                <CardContent className="flex items-center justify-between py-4 gap-4">
                  <div className="min-w-0">
                    <p className="font-medium">{d.diarist_name}</p>
                    <p className="text-sm text-muted-foreground">{d.obra_title}</p>
                    {d.descricao_diaria && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{d.descricao_diaria}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold">{d.quantidade}x</p>
                    <p className="text-xs text-muted-foreground">{formatDate(d.data)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog criar diária */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Diária</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((v) => createMutation.mutate(v))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Diarista *</Label>
              <Select onValueChange={(v) => setValue("diarista_id", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {(diaristasData?.items ?? []).map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.diarista_id && (
                <p className="text-xs text-destructive">{errors.diarista_id.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Obra *</Label>
              <Select onValueChange={(v) => setValue("obra_id", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {(obrasData?.items ?? []).map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.obra_id && (
                <p className="text-xs text-destructive">{errors.obra_id.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Quantidade</Label>
                <Input type="number" step="0.5" min="0.5" defaultValue={1} {...register("quantidade_diaria")} />
              </div>
              <div className="space-y-1.5">
                <Label>Data</Label>
                <Input type="date" {...register("data")} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Descrição (opcional)</Label>
              <Input placeholder="Ex: Assentamento de piso" {...register("descricao_diaria")} />
            </div>

            <div className="space-y-1.5">
              <Label>Data de pagamento (opcional)</Label>
              <Input type="date" {...register("data_pagamento")} />
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
    </PageTransition>
  );
}
