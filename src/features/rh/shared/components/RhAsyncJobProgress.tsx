import { RotateCcw, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { RhFolhaJob } from "@/types/rh.types";
import { formatCompetence, formatRhDate, statusLabel } from "../utils/formatters";

export function RhAsyncJobProgress({
  jobs,
  loading,
  onCancel,
  onRetry,
}: {
  jobs: RhFolhaJob[];
  loading?: boolean;
  onCancel?: (job: RhFolhaJob) => void;
  onRetry?: (job: RhFolhaJob) => void;
}) {
  if (loading) {
    return <p className="rounded-md border p-3 text-sm text-muted-foreground">Carregando jobs recentes...</p>;
  }

  if (!jobs.length) {
    return <p className="rounded-md border p-3 text-sm text-muted-foreground">Nenhum job recente de folha.</p>;
  }

  return (
    <div className="space-y-3">
      {jobs.map((job) => {
        const progress = Math.max(0, Math.min(100, Number(job.progress_percent ?? 0)));
        const active = ["queued", "running", "partial"].includes(job.status);
        return (
          <div key={job.id} className="rounded-md border p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">Folha {formatCompetence(job.mes, job.ano)}</p>
                <p className="text-xs text-muted-foreground">{job.updated_at ? formatRhDate(job.updated_at) : "Atualizacao nao enviada"}</p>
              </div>
              <Badge variant={job.status === "completed" ? "success" : job.status === "failed" ? "destructive" : "warning"}>
                {statusLabel(job.status)}
              </Badge>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>{job.processed_count ?? 0}/{job.total_count ?? 0} processados · {job.failed_count ?? 0} falhas</span>
              <div className="flex gap-2">
                {active && onCancel ? (
                  <Button size="sm" variant="outline" onClick={() => onCancel(job)}>
                    <Square className="size-4" /> Cancelar
                  </Button>
                ) : null}
                {job.status === "failed" && onRetry ? (
                  <Button size="sm" variant="outline" onClick={() => onRetry(job)}>
                    <RotateCcw className="size-4" /> Retry
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
