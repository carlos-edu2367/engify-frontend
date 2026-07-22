import { useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Trash2,
  ExternalLink,
  Building2,
  Receipt,
  CalendarClock,
  Tag,
  Banknote,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  useMovimentacaoAttachments,
  useCreateMovimentacaoAttachment,
  useDeleteMovimentacaoAttachment,
} from "@/hooks/useFinanceiro";
import { financeiroService } from "@/services/financeiro.service";
import { storageService } from "@/services/storage.service";
import { obrasService } from "@/services/obras.service";
import { formatCurrency, formatDate, getApiErrorMessage } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { MovimentacaoResponse } from "@/types/financeiro.types";
import { PixQrCodeBlock } from "@/components/features/financeiro/PixQrCodeBlock";
import { AttachmentManager } from "@/components/features/financeiro/AttachmentManager";

const classeLabels: Record<string, string> = {
  diarista: "Diarista",
  servico: "Serviço",
  contrato: "Contrato",
  material: "Material",
  fixo: "Fixo",
  operacional: "Operacional",
};

// ─── Main Sheet ────────────────────────────────────────────────────────────────
interface MovimentacaoDetailSheetProps {
  mov: MovimentacaoResponse | null;
  onClose: () => void;
  onDeleted?: (movId: string) => void;
}

export function MovimentacaoDetailSheet({ mov, onClose, onDeleted }: MovimentacaoDetailSheetProps) {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const movId = mov?.id ?? null;

  // Attachments
  const { data: attachments = [], isLoading: attLoading } = useMovimentacaoAttachments(movId);
  const createAttachment = useCreateMovimentacaoAttachment(movId ?? "");
  const deleteAttachment = useDeleteMovimentacaoAttachment(movId ?? "");

  // Obra lookup
  const { data: obra } = useQuery({
    queryKey: ["obras", mov?.obra_id],
    queryFn: () => obrasService.get(mov!.obra_id!),
    enabled: !!mov?.obra_id,
    staleTime: 5 * 60 * 1000,
  });

  // Pagamento lookup — busca diretamente pelo ID
  const { data: pagamento } = useQuery({
    queryKey: ["financeiro", "pagamentos", mov?.pagamento_id],
    queryFn: () => financeiroService.getPagamento(mov!.pagamento_id!),
    enabled: !!mov?.pagamento_id,
    staleTime: 5 * 60 * 1000,
  });

  async function handleUploadFiles(files: File[]) {
    if (!mov) return;
    setIsUploading(true);
    try {
      for (const file of files) {
        const path = await storageService.upload("financeiro", mov.id, file);
        await createAttachment.mutateAsync({
          file_path: path,
          file_name: file.name,
          content_type: file.type,
        });
      }
      toast.success(`${files.length} comprovante${files.length > 1 ? "s" : ""} adicionado${files.length > 1 ? "s" : ""}!`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Sheet open={!!mov} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg flex flex-col gap-0 p-0 overflow-hidden"
      >
        {mov && (
          <>
            {/* Header */}
            <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
              <div className="flex items-start gap-3 pr-6">
                <div
                  className={cn(
                    "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold",
                    mov.type === "entrada" ? "bg-emerald-500" : "bg-destructive"
                  )}
                >
                  {mov.type === "entrada" ? "+" : "−"}
                </div>
                <div className="min-w-0">
                  <SheetTitle className="text-base leading-snug">{mov.title}</SheetTitle>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <Badge
                      variant={mov.type === "entrada" ? "success" : "destructive"}
                      className="text-[10px] px-1.5 py-0 h-4"
                    >
                      {mov.type === "entrada" ? "Entrada" : "Saída"}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                      {classeLabels[mov.classe]}
                    </Badge>
                    {mov.natureza === "open_finance" && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-blue-500/40 text-blue-600">
                        Open Finance
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 shrink-0 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setConfirmDelete(true)}
                  title="Excluir movimentacao"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </SheetHeader>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

              {/* Valor + Data */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border bg-muted/20 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Banknote className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Valor</p>
                  </div>
                  <p
                    className={cn(
                      "text-lg font-bold",
                      mov.type === "entrada"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-destructive"
                    )}
                  >
                    {mov.type === "entrada" ? "+" : "−"}
                    {formatCurrency(mov.valor)}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/20 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Data</p>
                  </div>
                  <p className="text-sm font-medium">{formatDate(mov.data_movimentacao)}</p>
                </div>
              </div>

              {/* Origem / Rastreabilidade */}
              {(mov.obra_id || mov.pagamento_id) && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Origem
                  </p>

                  {/* Obra */}
                  {mov.obra_id && (
                    <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
                      <Building2 className="h-4 w-4 shrink-0 mt-0.5 text-primary/70" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground mb-0.5">Obra vinculada</p>
                        {obra ? (
                          <button
                            onClick={() => navigate(`/obras/${mov.obra_id}`)}
                            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors text-left"
                          >
                            {obra.title}
                            <ExternalLink className="h-3 w-3 shrink-0" />
                          </button>
                        ) : (
                          <Skeleton className="h-4 w-32" />
                        )}
                        {obra?.status && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 capitalize">
                            {obra.status.replace("_", " ")}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Pagamento origem */}
                  {mov.pagamento_id && (
                    <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 shrink-0 text-amber-500" />
                        <p className="text-xs text-muted-foreground">Gerada por pagamento agendado</p>
                      </div>
                      {pagamento ? (
                        <div className="space-y-1 pl-6">
                          <p className="text-sm font-medium">{pagamento.title}</p>
                          {pagamento.details && (
                            <p className="text-xs text-muted-foreground">{pagamento.details}</p>
                          )}
                          <div className="flex flex-wrap gap-3 pt-0.5">
                            <span className="text-xs text-muted-foreground">
                              Valor agendado:{" "}
                              <span className="font-medium text-foreground">
                                {formatCurrency(pagamento.valor)}
                              </span>
                            </span>
                            {pagamento.data_agendada && (
                              <span className="text-xs text-muted-foreground">
                                Vencimento:{" "}
                                <span className="font-medium text-foreground">
                                  {formatDate(pagamento.data_agendada)}
                                </span>
                              </span>
                            )}
                            {pagamento.payment_date && (
                              <span className="text-xs text-muted-foreground">
                                Pago em:{" "}
                                <span className="font-medium text-foreground">
                                  {formatDate(pagamento.payment_date)}
                                </span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <Tag className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[11px] text-muted-foreground capitalize">
                              {classeLabels[pagamento.classe]}
                            </span>
                            <Badge variant="success" className="text-[10px] px-1.5 py-0 h-4 ml-1">
                              Pago
                            </Badge>
                          </div>
                          {pagamento.pix_copy_and_past && (
                            <div className="pt-2">
                              <PixQrCodeBlock
                                payload={pagamento.pix_copy_and_past}
                                originalCode={pagamento.payment_cod}
                                compact
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="pl-6 space-y-1.5">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <Separator />

              <AttachmentManager
                attachments={attachments}
                isLoading={attLoading}
                isUploading={isUploading}
                onUploadFiles={handleUploadFiles}
                onDeleteAttachment={(id) => deleteAttachment.mutateAsync(id)}
              />
            </div>
          </>
        )}
      </SheetContent>
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Excluir movimentacao"
        description="Esta acao remove a movimentacao permanentemente."
        confirmLabel="Excluir"
        variant="destructive"
        onConfirm={() => {
          if (!mov) return;
          setIsDeleting(true);
          const deleteRequest =
            mov.type === "entrada" && mov.obra_id
              ? obrasService
                  .deleteRecebimento(mov.obra_id, mov.id)
                  .catch((err) => {
                    if (!axios.isAxiosError(err) || err.response?.status !== 400) {
                      throw err;
                    }
                    return financeiroService.deleteMovimentacao(mov.id);
                  })
              : financeiroService.deleteMovimentacao(mov.id);

          Promise.resolve(deleteRequest).then(() => {
            toast.success("Movimentacao removida.");
            setConfirmDelete(false);
            onDeleted?.(mov.id);
            onClose();
          }).catch((err) => {
            toast.error(getApiErrorMessage(err));
          }).finally(() => {
            setIsDeleting(false);
          });
        }}
        loading={isDeleting}
      />
    </Sheet>
  );
}
