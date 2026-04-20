import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { obrasService } from "@/services/obras.service";
import { storageService } from "@/services/storage.service";
import { MediaGallery } from "@/components/shared/MediaGallery";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { isAcceptedMediaType, MEDIA_UPLOAD_ACCEPTED_TYPES } from "@/lib/media";

interface ImagensTabProps {
  obraId: string;
  canEdit: boolean;
}

export function ImagensTab({ obraId, canEdit }: ImagensTabProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: clienteData, isLoading } = useQuery({
    queryKey: ["obras", obraId, "cliente"],
    queryFn: () => obrasService.getClienteView(obraId),
  });

  const images = clienteData?.images ?? [];

  const downloadUrls = useQuery({
    queryKey: ["obras", obraId, "imagens-urls", images.map((item) => item.file_path)],
    queryFn: async () => {
      const results: Record<string, string> = {};

      await Promise.all(
        images.map(async (image) => {
          const { download_url } = await storageService.getDownloadUrl(image.file_path);
          results[image.id] = download_url;
        })
      );

      return results;
    },
    enabled: images.length > 0,
  });

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter(isAcceptedMediaType);
    if (!files.length) return;

    setIsUploading(true);
    try {
      const uploaded = await storageService.uploadBatch("obra", obraId, files);

      await obrasService.addImagesBatch(
        obraId,
        uploaded.map((file) => ({
          file_path: file.path,
          file_name: file.file_name,
          content_type: file.content_type,
        }))
      );

      queryClient.invalidateQueries({ queryKey: ["obras", obraId, "cliente"] });
      toast.success(`${files.length} arquivo${files.length > 1 ? "s" : ""} adicionado${files.length > 1 ? "s" : ""}!`);
    } catch {
      toast.error("Erro ao fazer upload dos arquivos.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {images.length} {images.length !== 1 ? "arquivos" : "arquivo"} nesta obra
        </p>

        <RoleGuard roles={["admin", "engenheiro"]}>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={MEDIA_UPLOAD_ACCEPTED_TYPES.join(",")}
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="gap-2"
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {isUploading ? "Enviando..." : "Adicionar midia"}
            </Button>
          </div>
        </RoleGuard>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : images.length === 0 ? (
        <div onClick={canEdit ? () => fileInputRef.current?.click() : undefined}>
          <MediaGallery
            items={[]}
            emptyTitle="Nenhuma midia ainda"
            emptyDescription={canEdit ? "Clique para adicionar fotos, videos ou audios da obra" : undefined}
            className={canEdit ? "cursor-pointer transition-colors hover:border-primary/40 hover:bg-primary/5" : undefined}
          />
        </div>
      ) : (
        <MediaGallery
          items={images.map((image) => ({
            id: image.id,
            file_name: image.file_name,
            content_type: image.content_type,
            url: downloadUrls.data?.[image.id],
          }))}
          canRemove={canEdit}
          emptyTitle="Nenhuma midia ainda"
        />
      )}
    </div>
  );
}
