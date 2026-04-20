import { useState } from "react";
import { toast } from "sonner";
import {
  Download,
  ExternalLink,
  FileImage,
  FileText,
  Loader2,
  Paperclip,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { storageService } from "@/services/storage.service";
import { formatDate } from "@/lib/utils";
import type { MuralAttachmentResponse } from "@/types/mural.types";

interface MuralAttachmentsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attachments: MuralAttachmentResponse[];
  isLoading: boolean;
}

function MuralAttachmentRow({ attachment }: { attachment: MuralAttachmentResponse }) {
  const [isResolvingUrl, setIsResolvingUrl] = useState(false);
  const isImage = attachment.content_type.startsWith("image/");
  const kindLabel = isImage
    ? "Imagem"
    : attachment.content_type === "application/pdf"
      ? "PDF"
      : attachment.content_type;

  async function withSignedUrl(action: (url: string) => void) {
    setIsResolvingUrl(true);
    try {
      const { download_url } = await storageService.getDownloadUrl(attachment.file_path);
      action(download_url);
    } catch {
      toast.error("Erro ao abrir o arquivo.");
    } finally {
      setIsResolvingUrl(false);
    }
  }

  function handleOpen() {
    void withSignedUrl((url) => window.open(url, "_blank", "noopener,noreferrer"));
  }

  function handleDownload() {
    void withSignedUrl((url) => {
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = attachment.file_name;
      anchor.click();
    });
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background">
        {isImage ? (
          <FileImage className="h-4 w-4 text-primary/70" />
        ) : (
          <FileText className="h-4 w-4 text-destructive/70" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" title={attachment.file_name}>
          {attachment.file_name}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {kindLabel} • {formatDate(attachment.created_at, "dd/MM/yyyy 'as' HH:mm")}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleOpen}
          disabled={isResolvingUrl}
          title="Abrir documento"
        >
          {isResolvingUrl ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ExternalLink className="h-3.5 w-3.5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleDownload}
          disabled={isResolvingUrl}
          title="Baixar documento"
        >
          <Download className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function MuralAttachmentsSheet({
  open,
  onOpenChange,
  attachments,
  isLoading,
}: MuralAttachmentsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        <SheetHeader className="shrink-0 border-b px-6 py-6 pr-12">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <SheetTitle className="flex items-center gap-2 text-base leading-snug">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                Documentos do mural
              </SheetTitle>
              <SheetDescription className="mt-1">
                Veja todos os anexos publicados no mural desta obra em um so lugar.
              </SheetDescription>
            </div>
            <Badge variant="secondary" className="shrink-0">
              {attachments.length}
            </Badge>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : attachments.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/50 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60">
                <Paperclip className="h-5 w-5 text-muted-foreground/60" />
              </div>
              <p className="mt-4 text-sm font-medium text-foreground/80">
                Nenhum documento no mural ainda
              </p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                Quando a equipe anexar imagens ou arquivos em posts do mural, eles aparecerao aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Anexos do mural
                </p>
                <p className="text-xs text-muted-foreground">
                  {attachments.length} arquivo{attachments.length !== 1 ? "s" : ""}
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                {attachments.map((attachment) => (
                  <MuralAttachmentRow key={attachment.id} attachment={attachment} />
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
