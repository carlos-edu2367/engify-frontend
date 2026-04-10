import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Paperclip,
  Upload,
  Trash2,
  FileText,
  ImageIcon,
  ExternalLink,
  Building2,
  Receipt,
  X,
  ZoomIn,
  Loader2,
  Download,
  CalendarClock,
  Tag,
  Banknote,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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
import type { MovimentacaoResponse, MovimentacaoAttachmentResponse } from "@/types/financeiro.types";

const classeLabels: Record<string, string> = {
  diarista: "Diarista",
  servico: "Serviço",
  contrato: "Contrato",
  material: "Material",
  fixo: "Fixo",
  operacional: "Operacional",
};

// ─── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({ url, name, onClose }: { url: string; name: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <img
        src={url}
        alt={name}
        className="max-h-full max-w-full rounded-lg shadow-2xl object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Attachment Item ───────────────────────────────────────────────────────────
function AttachmentItem({
  att,
  movId,
}: {
  att: MovimentacaoAttachmentResponse;
  movId: string;
}) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const deleteMutation = useDeleteMovimentacaoAttachment(movId);

  const isImage = att.content_type.startsWith("image/");
  const isPdf = att.content_type === "application/pdf";

  async function handleView() {
    setLoadingUrl(true);
    try {
      const { download_url } = await storageService.getDownloadUrl(att.file_path);
      if (isImage) {
        setLightboxUrl(download_url);
      } else {
        window.open(download_url, "_blank");
      }
    } catch {
      toast.error("Erro ao abrir o arquivo.");
    } finally {
      setLoadingUrl(false);
    }
  }

  async function handleDownload() {
    setLoadingUrl(true);
    try {
      const { download_url } = await storageService.getDownloadUrl(att.file_path);
      const a = document.createElement("a");
      a.href = download_url;
      a.download = att.file_name;
      a.click();
    } catch {
      toast.error("Erro ao baixar o arquivo.");
    } finally {
      setLoadingUrl(false);
    }
  }

  function handleDelete() {
    deleteMutation.mutate(att.id, {
      onSuccess: () => toast.success("Comprovante removido."),
      onError: (err) => toast.error(getApiErrorMessage(err)),
    });
  }

  return (
    <>
      {lightboxUrl && (
        <Lightbox url={lightboxUrl} name={att.file_name} onClose={() => setLightboxUrl(null)} />
      )}
      <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 p-3 group">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border/60 bg-background">
          {isImage ? (
            <ImageIcon className="h-4 w-4 text-primary/70" />
          ) : (
            <FileText className="h-4 w-4 text-destructive/70" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium" title={att.file_name}>
            {att.file_name}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {isPdf ? "PDF" : isImage ? "Imagem" : att.content_type} · {formatDate(att.created_at)}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleView}
            disabled={loadingUrl}
            title={isImage ? "Visualizar" : "Abrir"}
          >
            {loadingUrl ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ZoomIn className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleDownload}
            disabled={loadingUrl}
            title="Baixar"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            title="Remover"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </>
  );
}

// ─── Main Sheet ────────────────────────────────────────────────────────────────
interface MovimentacaoDetailSheetProps {
  mov: MovimentacaoResponse | null;
  onClose: () => void;
}

export function MovimentacaoDetailSheet({ mov, onClose }: MovimentacaoDetailSheetProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const movId = mov?.id ?? null;

  // Attachments
  const { data: attachments = [], isLoading: attLoading } = useMovimentacaoAttachments(movId);
  const createAttachment = useCreateMovimentacaoAttachment(movId ?? "");

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

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!mov) return;
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
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
      e.target.value = "";
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

              {/* Comprovantes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Comprovantes
                    </p>
                    {attachments.length > 0 && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                        {attachments.length}
                      </Badge>
                    )}
                  </div>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1.5"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload className="h-3.5 w-3.5" />
                      )}
                      {isUploading ? "Enviando..." : "Anexar"}
                    </Button>
                  </div>
                </div>

                {attLoading ? (
                  <div className="space-y-2">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-14 rounded-lg" />
                    ))}
                  </div>
                ) : attachments.length === 0 ? (
                  <button
                    className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/50 py-8 text-center transition-colors hover:border-primary/40 hover:bg-primary/5"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/60">
                      <Paperclip className="h-5 w-5 text-muted-foreground/60" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Nenhum comprovante anexado</p>
                      <p className="text-xs text-muted-foreground/60 mt-0.5">
                        Clique para adicionar imagens ou PDFs
                      </p>
                    </div>
                  </button>
                ) : (
                  <div className="space-y-2">
                    {attachments.map((att) => (
                      <AttachmentItem key={att.id} att={att} movId={mov.id} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
