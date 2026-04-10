import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Copy, CalendarClock, CheckCircle2, Clock } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatISO, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { financeiroService } from "@/services/financeiro.service";
import { obrasService } from "@/services/obras.service";
import { obraPagamentoSchema, type ObraPagamentoFormValues } from "@/lib/schemas/financeiro.schemas";
import { formatCurrency, formatDate, getApiErrorMessage } from "@/lib/utils";
import type { PagamentoResponse } from "@/types/financeiro.types";

interface PagamentosTabProps {
  obraId: string;
}

export function PagamentosTab({ obraId }: PagamentosTabProps) {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["pagamentos", { obra: obraId }],
    queryFn: () => financeiroService.listPagamentos({ limit: 100, obra_id: obraId }),
  });

  const pagamentos: PagamentoResponse[] = data?.items ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ObraPagamentoFormValues>({
    resolver: zodResolver(obraPagamentoSchema),
  });

  const createMutation = useMutation({
    mutationFn: (values: ObraPagamentoFormValues) =>
      obrasService.createPagamento(obraId, {
        ...values,
        data_agendada: formatISO(parseISO(values.data_agendada)),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pagamentos"] });
      toast.success("Pagamento agendado!");
      setCreateOpen(false);
      reset();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  function handleCopyPix(cod: string) {
    navigator.clipboard.writeText(cod);
    toast.success("Código PIX copiado!");
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {pagamentos.length} pagamento{pagamentos.length !== 1 ? "s" : ""} agendado{pagamentos.length !== 1 ? "s" : ""} nesta obra
        </p>
        <RoleGuard roles={["admin", "engenheiro"]}>
          <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Agendar
          </Button>
        </RoleGuard>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : pagamentos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center mb-3">
            <CalendarClock className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Nenhum pagamento agendado</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Agende pagamentos de serviços extras contratados para esta obra.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {pagamentos.map((p) => (
            <Card key={p.id} className="border-border/50 shadow-sm">
              <CardContent className="flex items-start gap-4 py-4">
                {/* Ícone */}
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <CalendarClock className="h-4 w-4 text-primary" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{p.title}</p>
                    <Badge
                      variant={p.status === "pago" ? "success" : "warning"}
                      className="text-xs"
                    >
                      {p.status === "pago" ? (
                        <><CheckCircle2 className="h-3 w-3 mr-1" />Pago</>
                      ) : (
                        <><Clock className="h-3 w-3 mr-1" />Aguardando</>
                      )}
                    </Badge>
                  </div>

                  {p.details && (
                    <p className="text-xs text-muted-foreground truncate">{p.details}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <span>{formatCurrency(p.valor)}</span>
                    {p.data_agendada && <span>Venc. {formatDate(p.data_agendada)}</span>}
                  </div>

                  {p.payment_cod && (
                    <button
                      onClick={() => handleCopyPix(p.payment_cod!)}
                      className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors mt-0.5"
                      title="Copiar código PIX"
                    >
                      <Copy className="h-3 w-3" />
                      <span className="font-mono truncate max-w-[200px]">{p.payment_cod}</span>
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal criar */}
      <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) reset(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agendar Pagamento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((v) => createMutation.mutate(v))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Título *</Label>
              <Input placeholder="Ex: Serviço de elétrica" {...register("title")} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Detalhes *</Label>
              <Input placeholder="Ex: Instalação de quadro elétrico" {...register("details")} />
              {errors.details && <p className="text-xs text-destructive">{errors.details.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Valor *</Label>
                <Input type="number" step="0.01" min="0" placeholder="0.00" {...register("valor")} />
                {errors.valor && <p className="text-xs text-destructive">{errors.valor.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Data agendada *</Label>
                <Input type="date" {...register("data_agendada")} />
                {errors.data_agendada && (
                  <p className="text-xs text-destructive">{errors.data_agendada.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Código PIX *</Label>
              <Input placeholder="Cole o código PIX aqui" {...register("payment_cod")} />
              {errors.payment_cod && (
                <p className="text-xs text-destructive">{errors.payment_cod.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => { setCreateOpen(false); reset(); }}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Agendando..." : "Agendar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
