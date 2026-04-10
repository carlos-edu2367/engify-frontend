import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  HardHat,
  CalendarDays,
  AlertCircle,
  ImageIcon,
  ZoomIn,
  X,
  ClipboardList,
} from "lucide-react";
import { obrasService } from "@/services/obras.service";
import { PageTransition } from "@/components/layout/PageTransition";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PublicKanbanBoard } from "@/components/features/kanban/PublicKanbanBoard";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { PublicImageView, ObraStatus } from "@/types/obra.types";

// ── Labels / variantes ─────────────────────────────────────────────────────────

const STATUS_LABELS: Record<ObraStatus, string> = {
  planejamento: "Planejamento",
  em_andamento: "Em Andamento",
  finalizado: "Finalizado",
};

const STATUS_VARIANTS: Record<ObraStatus, "info" | "warning" | "success"> = {
  planejamento: "info",
  em_andamento: "warning",
  finalizado: "success",
};

// ── Barra de progresso inline ──────────────────────────────────────────────────

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="mt-5 space-y-1.5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Andamento geral</span>
        <span className="font-medium text-foreground">{value}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700",
            value === 100 ? "bg-emerald-500" : value >= 50 ? "bg-blue-500" : "bg-slate-400"
          )}
          style={{ width: `${value}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}

// ── Galeria de fotos públicas ──────────────────────────────────────────────────

function PublicImageCard({
  image,
  onClick,
}: {
  image: PublicImageView;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative aspect-square rounded-xl overflow-hidden border border-border/50 bg-muted/30 shadow-sm hover:shadow-md transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {image.download_url ? (
        <img
          src={image.download_url}
          alt={image.file_name}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      ) : (
        <div className="h-full w-full flex items-center justify-center">
          <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
        </div>
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
        <ZoomIn className="h-6 w-6 text-white drop-shadow" />
      </div>
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-[10px] text-white truncate">{image.file_name}</p>
      </div>
    </button>
  );
}

function PublicImageGallery({ images }: { images: PublicImageView[] }) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/50 py-16 text-center">
        <div className="h-14 w-14 rounded-full bg-muted/60 flex items-center justify-center mb-3">
          <ImageIcon className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Nenhuma foto disponível</p>
      </div>
    );
  }

  const current = lightbox !== null ? images[lightbox] : null;

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">
        {images.length} {images.length !== 1 ? "imagens" : "imagem"} nesta obra
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {images.map((img, i) => (
          <PublicImageCard
            key={img.id}
            image={img}
            onClick={() => setLightbox(i)}
          />
        ))}
      </div>

      {/* Lightbox */}
      {current && lightbox !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            onClick={() => setLightbox(null)}
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Navegação anterior */}
          {lightbox > 0 && (
            <button
              className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              onClick={(e) => { e.stopPropagation(); setLightbox(lightbox - 1); }}
              aria-label="Anterior"
            >
              <span className="text-lg leading-none">‹</span>
            </button>
          )}

          {/* Navegação próxima */}
          {lightbox < images.length - 1 && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              onClick={(e) => { e.stopPropagation(); setLightbox(lightbox + 1); }}
              aria-label="Próxima"
            >
              <span className="text-lg leading-none">›</span>
            </button>
          )}

          <div onClick={(e) => e.stopPropagation()}>
            <img
              src={current.download_url}
              alt={current.file_name}
              className="max-h-[85dvh] max-w-full rounded-lg shadow-2xl object-contain"
            />
            {images.length > 1 && (
              <p className="mt-2 text-center text-xs text-white/40">
                {lightbox + 1} / {images.length}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ── Skeletons ──────────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-muted/20">
        <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
          {/* Header skeleton */}
          <div className="bg-card rounded-2xl border border-border/50 p-6 md:p-8 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Skeleton className="h-7 w-28 rounded-full" />
              <Skeleton className="h-7 w-40 rounded-full" />
            </div>
            <Skeleton className="h-2 w-full rounded-full mt-4" />
          </div>
          {/* Kanban skeleton */}
          <div className="bg-card rounded-2xl border border-border/50 p-6 md:p-8 space-y-4">
            <Skeleton className="h-6 w-40" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-10 rounded-xl" />
                  <Skeleton className="h-16 rounded-lg" />
                  <Skeleton className="h-16 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
          {/* Galeria skeleton */}
          <div className="bg-card rounded-2xl border border-border/50 p-6 md:p-8 space-y-4">
            <Skeleton className="h-6 w-40" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

// ── Página ─────────────────────────────────────────────────────────────────────

export function ObraClientePage() {
  const { obraId } = useParams<{ obraId: string }>();

  const { data: obra, isLoading, isError } = useQuery({
    queryKey: ["public", "obras", obraId],
    queryFn: () => obrasService.getPublicView(obraId!),
    enabled: !!obraId,
    staleTime: 60_000, // 1 min — alinhado com o cache do backend
  });

  if (isLoading) return <PageSkeleton />;

  if (isError || !obra) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] text-center p-6">
        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-bold mb-2">Obra não encontrada</h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          O link pode estar quebrado ou a obra foi removida do sistema.
        </p>
      </div>
    );
  }

  // Cálculo de progresso baseado nos itens finalizados
  const totalItems = obra.items.length;
  const doneItems = obra.items.filter((i) => i.status === "finalizado").length;
  const progress = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  return (
    <PageTransition>
      <div className="min-h-screen bg-muted/20">
        <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">

          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-5 md:p-8">
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 shrink-0 bg-primary/10 rounded-full flex items-center justify-center">
                <HardHat className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground leading-tight">
                  {obra.title}
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Acompanhamento da obra
                </p>
              </div>
            </div>

            {/* Status + data de entrega */}
            <div className="flex flex-wrap items-center gap-2 mt-5">
              <Badge
                variant={STATUS_VARIANTS[obra.status]}
                className="px-3 py-1 text-xs font-medium"
              >
                {STATUS_LABELS[obra.status]}
              </Badge>

              {obra.data_entrega && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/40 px-3 py-1 rounded-full border border-border/60">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    Previsão:{" "}
                    <span className="font-medium text-foreground">
                      {formatDate(obra.data_entrega)}
                    </span>
                  </span>
                </div>
              )}
            </div>

            {/* Barra de progresso */}
            {totalItems > 0 && <ProgressBar value={progress} />}

            {/* Descrição */}
            {obra.description && (
              <div className="mt-5 pt-5 border-t border-border/40">
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {obra.description}
                </p>
              </div>
            )}
          </div>

          {/* ── Kanban ─────────────────────────────────────────────────────── */}
          <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-5 md:p-8">
            <div className="flex items-center gap-2 mb-5">
              <ClipboardList className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Andamento</h2>
              {totalItems > 0 && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {doneItems}/{totalItems} concluídos
                </span>
              )}
            </div>

            {totalItems === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center mb-3">
                  <ClipboardList className="h-5 w-5 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground">Nenhum item de andamento ainda</p>
              </div>
            ) : (
              <PublicKanbanBoard items={obra.items} />
            )}
          </div>

          {/* ── Galeria de fotos ────────────────────────────────────────────── */}
          <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-5 md:p-8">
            <div className="flex items-center gap-2 mb-5">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Progresso Fotográfico</h2>
            </div>
            <PublicImageGallery images={obra.images} />
          </div>

          {/* ── Rodapé discreto ─────────────────────────────────────────────── */}
          <p className="text-center text-xs text-muted-foreground/40 pb-4">
            Visão somente leitura · Engify
          </p>
        </div>
      </div>
    </PageTransition>
  );
}
