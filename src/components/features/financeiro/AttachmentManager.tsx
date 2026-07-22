import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  Paperclip, Upload, Trash2, FileText, ImageIcon, ZoomIn, Loader2, Download, X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { storageService } from "@/services/storage.service";
import { formatDate, getApiErrorMessage } from "@/lib/utils";

export interface AttachmentEntry {
  id: string;
  file_name: string;
  file_path: string;
  content_type: string;
  created_at: string;
}

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

function AttachmentManagerItem({
  att, onDelete, disabled,
}: { att: AttachmentEntry; onDelete: () => Promise<void>; disabled?: boolean }) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await onDelete();
      toast.success("Anexo removido.");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
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
          {!disabled && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
              onClick={handleDelete}
              disabled={isDeleting}
              title="Remover"
            >
              {isDeleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

export interface AttachmentManagerProps {
  attachments: AttachmentEntry[];
  isLoading: boolean;
  isUploading: boolean;
  onUploadFiles: (files: File[]) => Promise<void>;
  onDeleteAttachment: (attachmentId: string) => Promise<void>;
  disabled?: boolean;
  label?: string;
  emptyTitle?: string;
  emptyHint?: string;
}

export function AttachmentManager({
  attachments,
  isLoading,
  isUploading,
  onUploadFiles,
  onDeleteAttachment,
  disabled = false,
  label = "Comprovantes",
  emptyTitle = "Nenhum comprovante anexado",
  emptyHint = "Clique para adicionar imagens ou PDFs",
}: AttachmentManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    await onUploadFiles(files);
    e.target.value = "";
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {label}
          </p>
          {attachments.length > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
              {attachments.length}
            </Badge>
          )}
        </div>
        {!disabled && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={handleFileChange}
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
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : attachments.length === 0 ? (
        <button
          type="button"
          className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/50 py-8 text-center transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:opacity-50"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || disabled}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/60">
            <Paperclip className="h-5 w-5 text-muted-foreground/60" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{emptyTitle}</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">{emptyHint}</p>
          </div>
        </button>
      ) : (
        <div className="space-y-2">
          {attachments.map((att) => (
            <AttachmentManagerItem
              key={att.id}
              att={att}
              disabled={disabled}
              onDelete={() => onDeleteAttachment(att.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
