import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, Loader2, Trash2, FileImage, FileText } from "lucide-react";
import { itemsService } from "@/services/items.service";
import { storageService } from "@/services/storage.service";
import { RoleGuard } from "@/components/shared/RoleGuard";
import type { ItemResponse } from "@/types/item.types";
import type { ItemAttachmentResponse } from "@/types/attachment.types";
import { getApiErrorMessage } from "@/lib/utils";

const statusLabels: Record<string, string> = {
  planejamento: "Planejamento",
  em_andamento: "Em Andamento",
  finalizado: "Finalizado",
};

const statusVariants: Record<string, "info" | "warning" | "success"> = {
  planejamento: "info",
  em_andamento: "warning",
  finalizado: "success",
};

interface ItemDrawerProps {
  item: ItemResponse | null;
  obraId: string;
  usersMap?: Record<string, string>;
  onClose: () => void;
}

function AttachmentItem({
  attachment,
  downloadUrl,
  onDelete,
  canDelete,
}: {
  attachment: ItemAttachmentResponse;
  downloadUrl?: string;
  onDelete: () => void;
  canDelete: boolean;
}) {
  const isPdf = attachment.content_type === "application/pdf";
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 p-2.5 group">
      <a
        href={downloadUrl ?? "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 flex-1 min-w-0"
      >
        {isPdf ? (
          <FileText className="h-5 w-5 text-red-400 shrink-0" />
        ) : (
          <FileImage className="h-5 w-5 text-blue-400 shrink-0" />
        )}
        <span className="text-sm truncate text-foreground/80">{attachment.file_name}</span>
      </a>
      {canDelete && (
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive transition-all"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export function ItemDrawer({ item, obraId, usersMap = {}, onClose }: ItemDrawerProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: attachments = [], isLoading: isLoadingAtt } = useQuery({
    queryKey: ["obras", obraId, "items", item?.id, "attachments"],
    queryFn: () => itemsService.listAttachments(obraId, item!.id),
    enabled: !!item,
  });

  // Signed URLs para cada anexo
  const { data: urlMap = {} } = useQuery({
    queryKey: ["items-attachment-urls", attachments.map((a) => a.file_path)],
    queryFn: async () => {
      const map: Record<string, string> = {};
      await Promise.all(
        attachments.map(async (att) => {
          const { download_url } = await storageService.getDownloadUrl(att.file_path);
          map[att.id] = download_url;
        })
      );
      return map;
    },
    enabled: attachments.length > 0,
  });

  const deleteAttMutation = useMutation({
    mutationFn: (attachmentId: string) =>
      itemsService.deleteAttachment(obraId, item!.id, attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["obras", obraId, "items", item?.id, "attachments"],
      });
      toast.success("Anexo removido.");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !item) return;
    setIsUploading(true);
    try {
      for (const file of files) {
        const path = await storageService.upload("item", item.id, file);
        await itemsService.addAttachment(obraId, item.id, {
          file_path: path,
          file_name: file.name,
          content_type: file.type,
        });
      }
      queryClient.invalidateQueries({
        queryKey: ["obras", obraId, "items", item.id, "attachments"],
      });
      toast.success("Foto adicionada!");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  }

  if (!item) return null;

  return (
    <Sheet open={!!item} onOpenChange={(o: boolean) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto flex flex-col gap-6">
        <SheetHeader className="space-y-2">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-base leading-snug">{item.title}</SheetTitle>
              <Badge
                variant={statusVariants[item.status]}
                className="mt-2 text-xs"
              >
                {statusLabels[item.status]}
              </Badge>
            </div>
          </div>
        </SheetHeader>

        {/* Responsável */}
        {item.responsavel_id && usersMap[item.responsavel_id] && (
          <div>
            <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Responsável</p>
            <p className="text-sm">{usersMap[item.responsavel_id]}</p>
          </div>
        )}

        {/* Descrição */}
        {item.descricao && (
          <div>
            <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Descrição</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/80">{item.descricao}</p>
          </div>
        )}

        {/* Anexos */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Anexos ({attachments.length})
            </p>
            <RoleGuard roles={["admin", "engenheiro"]}>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleUpload}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="h-7 gap-1.5 text-xs"
                >
                  {isUploading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Upload className="h-3 w-3" />
                  )}
                  {isUploading ? "Enviando..." : "Adicionar foto"}
                </Button>
              </div>
            </RoleGuard>
          </div>

          {isLoadingAtt ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-11 rounded-lg" />
              ))}
            </div>
          ) : attachments.length === 0 ? (
            <p className="text-sm text-muted-foreground/60 text-center py-6">
              Nenhum anexo neste item.
            </p>
          ) : (
            <div className="space-y-2">
              {attachments.map((att) => (
                <AttachmentItem
                  key={att.id}
                  attachment={att}
                  downloadUrl={urlMap[att.id]}
                  onDelete={() => deleteAttMutation.mutate(att.id)}
                  canDelete={true}
                />
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
