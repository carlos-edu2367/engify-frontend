import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { AttachmentManager } from "@/components/features/financeiro/AttachmentManager";
import {
  useCreateMovimentacaoAttachment, useMovimentacaoAttachments,
} from "@/hooks/useFinanceiro";
import { storageService } from "@/services/storage.service";
import { getApiErrorMessage } from "@/lib/utils";

export interface ComprovanteDialogProps {
  movimentacaoId: string | null;
  description: string;
  onClose: () => void;
}

/**
 * Sugere — sem obrigar — anexar o comprovante a movimentacao recem-gerada.
 * A baixa ja foi efetuada quando este dialogo abre; fechar nao desfaz nada.
 */
export function ComprovanteDialog({
  movimentacaoId, description, onClose,
}: ComprovanteDialogProps) {
  const [isUploading, setIsUploading] = useState(false);
  const attachmentsQuery = useMovimentacaoAttachments(movimentacaoId);
  const createAttachment = useCreateMovimentacaoAttachment(movimentacaoId ?? "");

  async function handleUpload(files: File[]) {
    if (!movimentacaoId) return;
    setIsUploading(true);
    try {
      const uploads = await storageService.uploadBatch("financeiro", movimentacaoId, files);
      for (const u of uploads) {
        await createAttachment.mutateAsync({
          file_path: u.path,
          file_name: u.file_name,
          content_type: u.content_type,
          kind: "comprovante",
        });
      }
      toast.success("Comprovante anexado!");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Dialog open={!!movimentacaoId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Anexar comprovante</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{description}</p>
        <AttachmentManager
          attachments={(attachmentsQuery.data ?? []).filter((a) => a.kind === "comprovante")}
          isLoading={attachmentsQuery.isLoading}
          isUploading={isUploading}
          onUploadFiles={handleUpload}
          onDeleteAttachment={async () => {}}
          label="Comprovante"
          emptyTitle="Nenhum comprovante anexado"
          emptyHint="Clique para adicionar imagem ou PDF"
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Depois
          </Button>
          <Button onClick={onClose}>Concluir</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
