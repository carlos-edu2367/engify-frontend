import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CalendarDays, ClipboardList, HardHat, ImageIcon } from "lucide-react";
import { PublicKanbanBoard } from "@/components/features/kanban/PublicKanbanBoard";
import { PageTransition } from "@/components/layout/PageTransition";
import { MediaGallery } from "@/components/shared/MediaGallery";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { obrasService } from "@/services/obras.service";
import type { ObraStatus, PublicImageView } from "@/types/obra.types";

const STATUS_LABELS: Record<ObraStatus, string> = {
  planejamento: "Planejamento",
  em_andamento: "Em Andamento",
  financeiro: "Financeiro",
  finalizado: "Finalizado",
};

const STATUS_VARIANTS: Record<ObraStatus, "info" | "warning" | "success" | "secondary"> = {
  planejamento: "info",
  em_andamento: "warning",
  financeiro: "success",
  finalizado: "secondary",
};

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="mt-5 space-y-1.5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Andamento geral</span>
        <span className="font-medium text-foreground">{value}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
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

function PublicImageGallery({ images }: { images: PublicImageView[] }) {
  return (
    <>
      <p className="mb-4 text-sm text-muted-foreground">
        {images.length} {images.length !== 1 ? "arquivos" : "arquivo"} nesta obra
      </p>

      <MediaGallery
        items={images.map((image) => ({
          id: image.id,
          file_name: image.file_name,
          content_type: image.content_type,
          url: image.download_url,
        }))}
        emptyTitle="Nenhuma midia disponivel"
      />
    </>
  );
}

function PageSkeleton() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-muted/20">
        <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
          <div className="space-y-4 rounded-2xl border border-border/50 bg-card p-6 md:p-8">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Skeleton className="h-7 w-28 rounded-full" />
              <Skeleton className="h-7 w-40 rounded-full" />
            </div>
            <Skeleton className="mt-4 h-2 w-full rounded-full" />
          </div>

          <div className="space-y-4 rounded-2xl border border-border/50 bg-card p-6 md:p-8">
            <Skeleton className="h-6 w-40" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-10 rounded-xl" />
                  <Skeleton className="h-16 rounded-lg" />
                  <Skeleton className="h-16 rounded-lg" />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-border/50 bg-card p-6 md:p-8">
            <Skeleton className="h-6 w-40" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="aspect-square rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

export function ObraClientePage() {
  const { obraId } = useParams<{ obraId: string }>();

  const { data: obra, isLoading, isError } = useQuery({
    queryKey: ["public", "obras", obraId],
    queryFn: () => obrasService.getPublicView(obraId!),
    enabled: !!obraId,
    staleTime: 60_000,
  });

  if (isLoading) return <PageSkeleton />;

  if (isError || !obra) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="mb-2 text-xl font-bold">Obra nao encontrada</h2>
        <p className="max-w-xs text-sm text-muted-foreground">
          O link pode estar quebrado ou a obra foi removida do sistema.
        </p>
      </div>
    );
  }

  const totalItems = obra.items.length;
  const doneItems = obra.items.filter((item) => item.status === "finalizado").length;
  const progress = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  return (
    <PageTransition>
      <div className="min-h-screen bg-muted/20">
        <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
          <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm md:p-8">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <HardHat className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold leading-tight tracking-tight text-foreground md:text-3xl">
                  {obra.title}
                </h1>
                <p className="mt-0.5 text-sm text-muted-foreground">Acompanhamento da obra</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Badge variant={STATUS_VARIANTS[obra.status]} className="px-3 py-1 text-xs font-medium">
                {STATUS_LABELS[obra.status]}
              </Badge>

              {obra.data_entrega ? (
                <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-sm text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    Previsao: <span className="font-medium text-foreground">{formatDate(obra.data_entrega)}</span>
                  </span>
                </div>
              ) : null}
            </div>

            {totalItems > 0 ? <ProgressBar value={progress} /> : null}

            {obra.description ? (
              <div className="mt-5 border-t border-border/40 pt-5">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">{obra.description}</p>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm md:p-8">
            <div className="mb-5 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Andamento</h2>
              {totalItems > 0 ? (
                <span className="ml-auto text-xs text-muted-foreground">
                  {doneItems}/{totalItems} concluidos
                </span>
              ) : null}
            </div>

            {totalItems === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted/60">
                  <ClipboardList className="h-5 w-5 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground">Nenhum item de andamento ainda</p>
              </div>
            ) : (
              <PublicKanbanBoard items={obra.items} />
            )}
          </div>

          <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm md:p-8">
            <div className="mb-5 flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Galeria da obra</h2>
            </div>
            <PublicImageGallery images={obra.images} />
          </div>

          <p className="pb-4 text-center text-xs text-muted-foreground/40">Visao somente leitura | Engify</p>
        </div>
      </div>
    </PageTransition>
  );
}
