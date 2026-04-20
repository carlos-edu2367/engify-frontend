import { useMemo, useState } from "react";
import { AudioLines, FileText, ImageIcon, Play, Video, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { getMediaKind, type MediaKind } from "@/lib/media";
import { cn } from "@/lib/utils";

export interface GalleryMediaItem {
  id: string;
  file_name: string;
  url?: string;
  content_type?: string;
}

interface MediaGalleryProps {
  items: GalleryMediaItem[];
  canRemove?: boolean;
  onRemove?: (item: GalleryMediaItem) => void;
  emptyTitle: string;
  emptyDescription?: string;
  className?: string;
}

function MediaPlaceholder({ kind }: { kind: MediaKind }) {
  if (kind === "video") return <Video className="h-8 w-8 text-muted-foreground/40" />;
  if (kind === "audio") return <AudioLines className="h-8 w-8 text-muted-foreground/40" />;
  if (kind === "image") return <ImageIcon className="h-8 w-8 text-muted-foreground/40" />;
  return <FileText className="h-8 w-8 text-muted-foreground/40" />;
}

function MediaOverlayIcon({ kind }: { kind: MediaKind }) {
  if (kind === "video") return <Video className="h-6 w-6 text-white drop-shadow" />;
  if (kind === "audio") return <AudioLines className="h-6 w-6 text-white drop-shadow" />;
  if (kind === "image") return <Play className="h-6 w-6 text-white drop-shadow" />;
  return <FileText className="h-6 w-6 text-white drop-shadow" />;
}

function MediaPreview({ item, kind, interactive }: { item: GalleryMediaItem; kind: MediaKind; interactive?: boolean }) {
  if (!item.url) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <MediaPlaceholder kind={kind} />
      </div>
    );
  }

  if (kind === "image") {
    return (
      <img
        src={item.url}
        alt={item.file_name}
        className={cn("h-full w-full object-cover transition-transform duration-300", interactive && "group-hover:scale-105")}
        loading="lazy"
      />
    );
  }

  if (kind === "video") {
    return (
      <video
        src={item.url}
        className="h-full w-full object-cover"
        muted
        playsInline
        preload="metadata"
      />
    );
  }

  if (kind === "audio") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
          <AudioLines className="h-7 w-7 text-white" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/60">Audio</p>
          <p className="line-clamp-2 text-sm text-white/90">{item.file_name}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-4 text-center">
      <FileText className="h-8 w-8 text-muted-foreground/40" />
      <p className="line-clamp-2 text-xs text-muted-foreground">{item.file_name}</p>
    </div>
  );
}

function MediaViewer({ item, kind }: { item: GalleryMediaItem; kind: MediaKind }) {
  if (!item.url) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center rounded-2xl border border-white/10 bg-black/20">
        <div className="text-center text-white/70">
          <MediaPlaceholder kind={kind} />
          <p className="mt-3 text-sm">Midia indisponivel para visualizacao.</p>
        </div>
      </div>
    );
  }

  if (kind === "image") {
    return <img src={item.url} alt={item.file_name} className="mx-auto max-h-[78vh] max-w-full rounded-2xl object-contain" />;
  }

  if (kind === "video") {
    return (
      <video
        src={item.url}
        className="mx-auto max-h-[78vh] w-full rounded-2xl bg-black object-contain"
        controls
        autoPlay
        playsInline
      />
    );
  }

  if (kind === "audio") {
    return (
      <div className="mx-auto flex min-h-[40vh] w-full max-w-2xl flex-col items-center justify-center gap-6 rounded-2xl border border-white/10 bg-white/5 px-6 py-10 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
          <AudioLines className="h-10 w-10 text-white" />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">Audio local</p>
          <h3 className="text-lg font-semibold text-white">{item.file_name}</h3>
        </div>
        <audio src={item.url} controls autoPlay className="w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[40vh] w-full max-w-xl flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-6 py-10 text-center">
      <FileText className="h-10 w-10 text-white/80" />
      <p className="text-sm text-white/80">{item.file_name}</p>
    </div>
  );
}

export function MediaGallery({
  items,
  canRemove = false,
  onRemove,
  emptyTitle,
  emptyDescription,
  className,
}: MediaGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);

  const itemsWithKind = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        kind: getMediaKind({ fileName: item.file_name, contentType: item.content_type }),
      })),
    [items]
  );

  const currentItem = currentIndex !== null ? itemsWithKind[currentIndex] : null;

  if (items.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/50 py-16 text-center", className)}>
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted/60">
          <ImageIcon className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">{emptyTitle}</p>
        {emptyDescription ? <p className="mt-1 text-xs text-muted-foreground/60">{emptyDescription}</p> : null}
      </div>
    );
  }

  return (
    <>
      <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4", className)}>
        {itemsWithKind.map((item, index) => (
          <div
            key={item.id}
            onClick={() => setCurrentIndex(index)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setCurrentIndex(index);
              }
            }}
            role="button"
            tabIndex={0}
            className="group relative aspect-square overflow-hidden rounded-xl border border-border/50 bg-muted/30 text-left shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <MediaPreview item={item} kind={item.kind} interactive />

            <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/25 group-hover:opacity-100">
              <MediaOverlayIcon kind={item.kind} />
            </div>

            {canRemove && onRemove ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove(item);
                }}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-destructive group-hover:opacity-100"
                aria-label={`Remover ${item.file_name}`}
              >
                <X className="h-3 w-3" />
              </button>
            ) : null}

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5 opacity-0 transition-opacity group-hover:opacity-100">
              <p className="truncate text-[10px] text-white">{item.file_name}</p>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={currentIndex !== null} onOpenChange={(open) => !open && setCurrentIndex(null)}>
        {currentItem ? (
          <DialogContent className="max-h-[92vh] max-w-[min(96vw,1100px)] overflow-hidden border-white/10 bg-zinc-950 p-0 text-white">
            <DialogTitle className="sr-only">{currentItem.file_name}</DialogTitle>

            {itemsWithKind.length > 1 && currentIndex !== null ? (
              <>
                <button
                  type="button"
                  onClick={() => setCurrentIndex(currentIndex === 0 ? itemsWithKind.length - 1 : currentIndex - 1)}
                  className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                  aria-label="Midia anterior"
                >
                  <span className="text-lg leading-none">&lt;</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentIndex(currentIndex === itemsWithKind.length - 1 ? 0 : currentIndex + 1)}
                  className="absolute right-14 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                  aria-label="Proxima midia"
                >
                  <span className="text-lg leading-none">&gt;</span>
                </button>
              </>
            ) : null}

            <div className="flex max-h-[92vh] flex-col">
              <div className="border-b border-white/10 px-5 py-4 pr-16">
                <p className="truncate text-sm font-medium text-white">{currentItem.file_name}</p>
                {currentIndex !== null && itemsWithKind.length > 1 ? (
                  <p className="mt-1 text-xs text-white/50">
                    {currentIndex + 1} / {itemsWithKind.length}
                  </p>
                ) : null}
              </div>

              <div className="overflow-auto p-5">
                <MediaViewer item={currentItem} kind={currentItem.kind} />
              </div>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </>
  );
}
