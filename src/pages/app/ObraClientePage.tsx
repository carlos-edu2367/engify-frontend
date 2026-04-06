import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { HardHat, CalendarDays, AlertCircle } from "lucide-react";
import { obrasService } from "@/services/obras.service";
import { PageTransition } from "@/components/layout/PageTransition";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { ImagensTab } from "@/components/features/imagens/ImagensTab";

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

export function ObraClientePage() {
  const { obraId } = useParams<{ obraId: string }>();

  const { data: obra, isLoading, isError } = useQuery({
    queryKey: ["obras", obraId, "cliente"],
    queryFn: () => obrasService.getClienteView(obraId!),
    enabled: !!obraId,
  });

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-4 max-w-5xl mx-auto p-6 md:p-8 mt-12 bg-card rounded-2xl shadow-sm border border-border/50">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </div>
      </PageTransition>
    );
  }

  if (isError || !obra) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2">Obra não encontrada</h2>
        <p className="text-muted-foreground">O link pode estar quebrado ou a obra foi removida do sistema.</p>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-muted/20">
        <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">
          
          {/* Header Publico */}
          <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-6 md:p-8">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                <HardHat className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold tracking-tight truncate text-foreground">{obra.title}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Visão de acompanhamento da obra
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm mt-6">
              <Badge variant={statusVariants[obra.status] as any} className="px-3 py-1">
                {statusLabels[obra.status] || obra.status}
              </Badge>

              {obra.data_entrega && (
                <div className="flex items-center gap-2 text-muted-foreground bg-muted/40 px-3 py-1 rounded-full border border-border/60">
                  <CalendarDays className="h-4 w-4" />
                  <span>Previsão de entrega: <span className="font-medium text-foreground">{formatDate(obra.data_entrega)}</span></span>
                </div>
              )}
            </div>
            
            {obra.description && (
              <div className="mt-6 pt-6 border-t border-border/40">
                <p className="text-foreground/80 leading-relaxed text-sm whitespace-pre-wrap">
                  {obra.description}
                </p>
              </div>
            )}
          </div>

          {/* Galeria */}
          <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-6 md:p-8">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              Progresso Fotográfico
            </h2>
            <ImagensTab obraId={obraId!} canEdit={false} />
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
