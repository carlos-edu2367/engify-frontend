import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  Paperclip,
  Upload,
  Trash2,
  FileText,
  ImageIcon,
  X,
  ZoomIn,
  Loader2,
  Download,
  Banknote,
  CalendarClock,
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
import { useDeleteRecebimento } from "@/hooks/useObras";
import { storageService } from "@/services/storage.service";
import { formatCurrency, formatDate, getApiErrorMessage } from "@/lib/utils";
import type { MovimentacaoAttachmentResponse } from "@/types/financeiro.types";
import type { ObraEntradaResponse } from "@/types/obra.types";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

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
function AttachmentItem({ att, movId }: { att: MovimentacaoAttachmentResponse; movId: string }) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const deleteMutation = useDeleteMovimentacaoAttachment(movId);

  const isImage = att.content_type.startsWith("image/");
  const isPdf = att.content_type === "application/pdf";

  async function handleView() {
    setLoadingUrl(true);
    try {
      const { download_url } = await storageService.getDownloadUrl(att.file_path);
      if (isImage) setLightboxUrl(download_url);
      else window.open(download_url, "_blank");
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

  return (
    <>
      {lightboxUrl && (
        <Lightbox url={lightboxUrl} name={att.file_name} onClose={() => setLightboxUrl(null)} />
      )}
      <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
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
            onClick={() =>
              deleteMutation.mutate(att.id, {
                onSuccess: () => toast.success("Documento removido."),
                onError: (err) => toast.error(getApiErrorMessage(err)),
              })
            }
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
interface EntradaAnexosSheetProps {
  entrada: ObraEntradaResponse | null;
  onClose: () => void;
  onDeleted?: (entradaId: string) => void;
}

export function EntradaAnexosSheet({ entrada, onClose, onDeleted }: EntradaAnexosSheetProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const movId = entrada?.id ?? null;
  const { data: attachments = [], isLoading: attLoading } = useMovimentacaoAttachments(movId);
  const createAttachment = useCreateMovimentacaoAttachment(movId ?? "");
  const deleteRecebimento = useDeleteRecebimento(entrada?.obra_id);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!entrada) return;
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setIsUploading(true);
    try {
      for (const file of files) {
        const path = await storageService.upload("financeiro", entrada.id, file);
        await createAttachment.mutateAsync({
          file_path: path,
          file_name: file.name,
          content_type: file.type,
        });
      }
      toast.success(
        `${files.length} documento${files.length > 1 ? "s" : ""} adicionado${files.length > 1 ? "s" : ""}!`
      );
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  }

  return (
    <Sheet open={!!entrada} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col gap-0 p-0 overflow-hidden"
      >
        {entrada && (
          <>
            {/* Header */}
            <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
              <div className="flex items-start gap-3 pr-6">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white text-sm font-bold">
                  +
                </div>
                <div className="min-w-0">
                  <SheetTitle className="text-base leading-snug">{entrada.title}</SheetTitle>
                  <Badge variant="success" className="text-[10px] px-1.5 py-0 h-4 mt-1">
                    Recebimento
                  </Badge>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 shrink-0 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setConfirmDelete(true)}
                  title="Excluir recebimento"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </SheetHeader>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Valor + Data */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border bg-muted/20 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Banknote className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Valor</p>
                  </div>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    +{formatCurrency(entrada.valor)}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/20 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Data</p>
                  </div>
                  <p className="text-sm font-medium">{formatDate(entrada.data_movimentacao)}</p>
                </div>
              </div>

              <Separator />

              {/* Documentos */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Documentos
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
                      <p className="text-sm text-muted-foreground">Nenhum documento anexado</p>
                      <p className="text-xs text-muted-foreground/60 mt-0.5">
                        Comprovante, nota fiscal, recibo...
                      </p>
                    </div>
                  </button>
                ) : (
                  <div className="space-y-2">
                    {attachments.map((att) => (
                      <AttachmentItem key={att.id} att={att} movId={entrada.id} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Excluir recebimento"
        description="Esta acao remove o recebimento permanentemente e o total recebido da obra sera recalculado."
        confirmLabel="Excluir"
        variant="destructive"
        onConfirm={() => {
          if (!entrada) return;
          deleteRecebimento.mutate(entrada.id, {
            onSuccess: () => {
              toast.success("Recebimento removido.");
              setConfirmDelete(false);
              onDeleted?.(entrada.id);
              onClose();
            },
            onError: (err) => toast.error(getApiErrorMessage(err)),
          });
        }}
        loading={deleteRecebimento.isPending}
      />
    </Sheet>
  );
}
