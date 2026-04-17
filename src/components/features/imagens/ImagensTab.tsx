import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload, ImageIcon, X, ZoomIn, Loader2, Video } from "lucide-react";
import { obrasService } from "@/services/obras.service";
import { storageService } from "@/services/storage.service";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { cn } from "@/lib/utils";
import type { ObraImageResponse } from "@/types/attachment.types";

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/webm",
];

interface ImagensTabProps {
  obraId: string;
  canEdit: boolean;
}

function isVideo(item: ObraImageResponse): boolean {
  if (item.content_type) return item.content_type.startsWith("video/");
  const ext = item.file_name.split(".").pop()?.toLowerCase();
  return ext === "mp4" || ext === "mov" || ext === "webm";
}

function MediaCard({
  item,
  onRemove,
  canRemove,
}: {
  item: ObraImageResponse & { downloadUrl?: string };
  onRemove?: () => void;
  canRemove: boolean;
}) {
  const [lightbox, setLightbox] = useState(false);
  const video = isVideo(item);

  return (
    <>
      <div className="group relative aspect-square rounded-xl overflow-hidden border border-border/50 bg-muted/30 cursor-pointer shadow-sm hover:shadow-md transition-shadow">
        {item.downloadUrl ? (
          video ? (
            <video
              src={item.downloadUrl}
              className="h-full w-full object-cover"
              onClick={() => setLightbox(true)}
              muted
              playsInline
            />
          ) : (
            <img
              src={item.downloadUrl}
              alt={item.file_name}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
              onClick={() => setLightbox(true)}
            />
          )
        ) : (
          <div className="h-full w-full flex items-center justify-center" onClick={() => setLightbox(true)}>
            {video ? (
              <Video className="h-8 w-8 text-muted-foreground/40" />
            ) : (
              <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
            )}
          </div>
        )}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          {video ? <Video className="h-6 w-6 text-white drop-shadow" /> : <ZoomIn className="h-6 w-6 text-white drop-shadow" />}
        </div>

        {canRemove && onRemove && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-destructive"
          >
            <X className="h-3 w-3" />
          </button>
        )}

        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-[10px] text-white truncate">{item.file_name}</p>
        </div>
      </div>

      {lightbox && item.downloadUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          {video ? (
            <video
              src={item.downloadUrl}
              className="max-h-full max-w-full rounded-lg shadow-2xl"
              controls
              autoPlay
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={item.downloadUrl}
              alt={item.file_name}
              className="max-h-full max-w-full rounded-lg shadow-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          )}
          <button
            className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
            onClick={() => setLightbox(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );
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
    queryKey: ["obras", obraId, "imagens-urls", images.map((i) => i.file_path)],
    queryFn: async () => {
      const results: Record<string, string> = {};
      await Promise.all(
        images.map(async (img) => {
          const { download_url } = await storageService.getDownloadUrl(img.file_path);
          results[img.id] = download_url;
        })
      );
      return results;
    },
    enabled: images.length > 0,
  });

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).filter((f) =>
      ACCEPTED_TYPES.includes(f.type)
    );
    if (!files.length) return;

    setIsUploading(true);
    try {
      // Etapa 1 + 2a: obtém URLs e faz PUT em paralelo
      const uploaded = await storageService.uploadBatch("obra", obraId, files);

      // Etapa 2b: registra todos de uma vez no backend
      await obrasService.addImagesBatch(obraId, uploaded.map((u) => ({
        file_path: u.path,
        file_name: u.file_name,
        content_type: u.content_type,
      })));

      queryClient.invalidateQueries({ queryKey: ["obras", obraId, "cliente"] });
      toast.success(`${files.length} arquivo${files.length > 1 ? "s" : ""} adicionado${files.length > 1 ? "s" : ""}!`);
    } catch {
      toast.error("Erro ao fazer upload dos arquivos.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
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
              accept={ACCEPTED_TYPES.join(",")}
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
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {isUploading ? "Enviando..." : "Adicionar mídia"}
            </Button>
          </div>
        </RoleGuard>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : images.length === 0 ? (
        <div
          className={cn(
            "flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/50 py-20 text-center transition-colors",
            canEdit && "cursor-pointer hover:border-primary/40 hover:bg-primary/5"
          )}
          onClick={canEdit ? () => fileInputRef.current?.click() : undefined}
        >
          <div className="h-14 w-14 rounded-full bg-muted/60 flex items-center justify-center mb-3">
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Nenhuma mídia ainda</p>
          {canEdit && (
            <p className="text-xs text-muted-foreground/60 mt-1">Clique para adicionar fotos ou vídeos da obra</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img) => (
            <MediaCard
              key={img.id}
              item={{ ...img, downloadUrl: downloadUrls.data?.[img.id] }}
              canRemove={canEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}
