import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Copy, CalendarClock, CheckCircle2, Clock, Trash2 } from "lucide-react";
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
import { PixQrCodeBlock } from "@/components/features/financeiro/PixQrCodeBlock";
import { MovimentacaoGeradaSection } from "@/components/features/financeiro/MovimentacaoGeradaSection";
import { financeiroService } from "@/services/financeiro.service";
import { obrasService } from "@/services/obras.service";
import { storageService } from "@/services/storage.service";
import { obraPagamentoSchema, type ObraPagamentoFormValues } from "@/lib/schemas/financeiro.schemas";
import { formatCurrency, formatDate, formatLocalDateTime, getApiErrorMessage } from "@/lib/utils";
import { buildParcelasPreview } from "@/lib/parcelamento";
import { parseHumanCurrencyToDecimalString } from "@/lib/money-input";
import { useAuthStore } from "@/store/auth.store";
import type { PagamentoResponse } from "@/types/financeiro.types";

interface PagamentosTabProps {
  obraId: string;
}

function PaymentCreatorMeta({ payment }: { payment: PagamentoResponse }) {
  const createdBy = payment.created_by_name || payment.created_by_user_id || "Sistema/legado";
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      {payment.created_by_engineer && (
        <Badge variant="outline" className="border-blue-500/30 bg-blue-500/5 text-blue-600 dark:text-blue-300">
          Criado por engenheiro
        </Badge>
      )}
      <span>Criado por: {createdBy}</span>
      {payment.created_at && <span>Criado em: {formatLocalDateTime(payment.created_at)}</span>}
    </div>
  );
}

export function PagamentosTab({ obraId }: PagamentosTabProps) {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [deletePagamentoId, setDeletePagamentoId] = useState<string | null>(null);
  const [scope, setScope] = useState<"mine" | "all">("mine");
  const [pagFiles, setPagFiles] = useState<File[]>([]);
  const [parcelaCods, setParcelaCods] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const isEngenheiro = useAuthStore((s) => s.user?.role === "engenheiro");

  const { data, isLoading } = useQuery({
    queryKey: ["pagamentos", { obra: obraId, scope: isEngenheiro ? scope : "all" }],
    queryFn: () =>
      financeiroService.listPagamentos({
        limit: 100,
        obra_id: obraId,
        scope: isEngenheiro ? scope : "all",
      }),
  });

  const pagamentos: PagamentoResponse[] = data?.items ?? [];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ObraPagamentoFormValues>({
    resolver: zodResolver(obraPagamentoSchema),
  });

  const parcelasWatch = Number(watch("parcelas") ?? 1);
  const valorWatch = watch("valor");
  const dataWatch = watch("data_agendada");
  const parcelasPreview = useMemo(() => {
    if (!parcelasWatch || parcelasWatch < 2) return [];
    let decimal: string;
    try {
      decimal = parseHumanCurrencyToDecimalString(String(valorWatch ?? ""));
    } catch {
      return [];
    }
    return buildParcelasPreview(decimal, parcelasWatch, String(dataWatch ?? ""));
  }, [parcelasWatch, valorWatch, dataWatch]);

  const createMutation = useMutation({
    mutationFn: async (values: ObraPagamentoFormValues) => {
      const parcelas = Number(values.parcelas ?? 1);
      const data_agendada = formatISO(parseISO(values.data_agendada));

      if (parcelas >= 2) {
        const criadas = await obrasService.createPagamentoParcelado(obraId, {
          title: values.title,
          details: values.details,
          valor: values.valor,
          data_agendada,
          parcelas,
          payment_cods: Array.from({ length: parcelas }, (_, i) =>
            i === 0 ? values.payment_cod ?? null : parcelaCods[i]?.trim() || null,
          ),
          requires_receipt: values.requires_receipt,
        });
        if (pagFiles.length) {
          const primeira = criadas[0];
          const uploads = await storageService.uploadBatch("pagamento", primeira.id, pagFiles);
          for (const u of uploads) {
            await financeiroService.createPagamentoAttachment(primeira.id, {
              file_path: u.path,
              file_name: u.file_name,
              content_type: u.content_type,
              replicate_parcelamento: true,
            });
          }
        }
        return criadas[0];
      }

      const pag = await obrasService.createPagamento(obraId, {
        ...values,
        payment_cod: values.payment_cod ?? "",
        data_agendada,
      });
      if (pagFiles.length) {
        const uploads = await storageService.uploadBatch("pagamento", pag.id, pagFiles);
        for (const u of uploads) {
          await financeiroService.createPagamentoAttachment(pag.id, {
            file_path: u.path, file_name: u.file_name, content_type: u.content_type,
          });
        }
      }
      return pag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pagamentos"] });
      toast.success("Pagamento agendado!");
      setCreateOpen(false);
      setPagFiles([]);
      setParcelaCods([]);
      reset();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, scope }: { id: string; scope: "self" | "parcelamento" }) =>
      financeiroService.deletePagamento(id, scope),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pagamentos"] });
      queryClient.invalidateQueries({ queryKey: ["financeiro"] });
      queryClient.invalidateQueries({ queryKey: ["obras"] });
      toast.success("Pagamento removido.");
      setDeletePagamentoId(null);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const pagamentoParaExcluir = pagamentos.find((p) => p.id === deletePagamentoId) ?? null;

  function handleCopyPix(cod: string) {
    navigator.clipboard.writeText(cod);
    toast.success("Código PIX copiado!");
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">
          {pagamentos.length} pagamento{pagamentos.length !== 1 ? "s" : ""} agendado{pagamentos.length !== 1 ? "s" : ""} nesta obra
        </p>
        <div className="flex items-center gap-2">
          {isEngenheiro && (
            <div className="flex items-center gap-1 rounded-lg bg-muted/60 p-0.5">
              <Button
                size="sm"
                variant={scope === "mine" ? "default" : "ghost"}
                className="h-7 px-2.5 text-xs"
                onClick={() => setScope("mine")}
              >
                Meus pagamentos
              </Button>
              <Button
                size="sm"
                variant={scope === "all" ? "default" : "ghost"}
                className="h-7 px-2.5 text-xs"
                onClick={() => setScope("all")}
              >
                Todos os pagamentos
              </Button>
            </div>
          )}
          <RoleGuard roles={["admin", "engenheiro"]}>
            <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Agendar
            </Button>
          </RoleGuard>
        </div>
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
                    {p.parcela_total ? (
                      <Badge variant="outline" className="text-xs">
                        {p.parcela_numero}/{p.parcela_total}
                      </Badge>
                    ) : null}
                    {p.status === "pago" && p.requires_receipt && !p.receipt_attached ? (
                      <Badge variant="warning" className="text-xs">
                        Comprovante pendente
                      </Badge>
                    ) : null}
                  </div>

                  {p.details && (
                    <p className="text-xs text-muted-foreground truncate">{p.details}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <span>{formatCurrency(p.valor)}</span>
                    {p.data_agendada && <span>Venc. {formatDate(p.data_agendada)}</span>}
                  </div>
                  <PaymentCreatorMeta payment={p} />

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

                  {p.status === "aguardando" && p.pix_copy_and_past && (
                    <div className="pt-2">
                      <PixQrCodeBlock
                        payload={p.pix_copy_and_past}
                        originalCode={p.payment_cod}
                        compact
                      />
                    </div>
                  )}

                  {p.status === "pago" && (
                    <div className="pt-2 space-y-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                      >
                        {expandedId === p.id ? "Ocultar comprovacao" : "Ver comprovacao"}
                      </Button>
                      {expandedId === p.id && (
                        <MovimentacaoGeradaSection pagamentoId={p.id} enabled />
                      )}
                    </div>
                  )}
                </div>
                {p.status === "aguardando" && (
                  <RoleGuard roles={["admin", "engenheiro", "financeiro"]}>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeletePagamentoId(p.id)}
                      title="Excluir pagamento"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </RoleGuard>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal criar */}
      <Dialog
        open={createOpen}
        onOpenChange={(o) => { setCreateOpen(o); if (!o) { reset(); setPagFiles([]); setParcelaCods([]); } }}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
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
                <Input inputMode="decimal" placeholder="190,50" {...register("valor")} />
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

            <div className="space-y-1">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="h-4 w-4 rounded border-border" {...register("requires_receipt")} />
                Necessita de comprovante
              </label>
              <p className="text-xs text-muted-foreground">
                Ao marcar como pago, sugerimos anexar o comprovante a movimentacao. Nao e obrigatorio.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Parcelar em</Label>
              <Input type="number" min={1} max={36} {...register("parcelas")} />
              {errors.parcelas && <p className="text-xs text-destructive">{errors.parcelas.message}</p>}
              <p className="text-xs text-muted-foreground">
                1 = pagamento avulso. A partir de 2, o valor informado é o TOTAL.
              </p>
            </div>

            {parcelasPreview.length > 0 && (
              <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Parcelas
                </p>
                {parcelasPreview.map((parcela, i) => (
                  <div key={parcela.numero} className="flex items-center gap-2">
                    <span className="w-12 shrink-0 text-xs text-muted-foreground">
                      {parcela.numero}/{parcelasPreview.length}
                    </span>
                    <span className="w-24 shrink-0 text-sm font-medium">
                      {formatCurrency(parcela.valor)}
                    </span>
                    <span className="w-24 shrink-0 text-xs text-muted-foreground">
                      {formatDate(parcela.data)}
                    </span>
                    {i > 0 && (
                      <Input
                        className="h-8 text-xs"
                        placeholder="Codigo (opcional)"
                        value={parcelaCods[i] ?? ""}
                        onChange={(e) => {
                          const next = [...parcelaCods];
                          next[i] = e.target.value;
                          setParcelaCods(next);
                        }}
                      />
                    )}
                  </div>
                ))}
                <p className="text-[11px] text-muted-foreground">
                  O codigo PIX informado acima e o da 1a parcela.
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Anexos (opcional)</Label>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => setPagFiles(Array.from(e.target.files ?? []))}
                className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-xs file:font-medium hover:file:bg-muted/80"
              />
              {pagFiles.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {pagFiles.length} arquivo(s) selecionado(s)
                </p>
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

      <Dialog open={!!deletePagamentoId} onOpenChange={(o) => !o && setDeletePagamentoId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir pagamento</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {pagamentoParaExcluir?.parcela_total
              ? `Esta e a parcela ${pagamentoParaExcluir.parcela_numero}/${pagamentoParaExcluir.parcela_total} de um parcelamento. Parcelas ja pagas nunca sao removidas.`
              : "Esta acao remove o pagamento agendado. Pagamentos ja pagos nao podem ser removidos."}
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeletePagamentoId(null)}>
              Cancelar
            </Button>
            {pagamentoParaExcluir?.parcela_total ? (
              <Button
                variant="destructive"
                onClick={() =>
                  deletePagamentoId &&
                  deleteMutation.mutate({ id: deletePagamentoId, scope: "parcelamento" })
                }
              >
                Excluir todas as parcelas aguardando
              </Button>
            ) : null}
            <Button
              variant="destructive"
              onClick={() =>
                deletePagamentoId && deleteMutation.mutate({ id: deletePagamentoId, scope: "self" })
              }
              disabled={deleteMutation.isPending}
            >
              {pagamentoParaExcluir?.parcela_total ? "So esta parcela" : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
