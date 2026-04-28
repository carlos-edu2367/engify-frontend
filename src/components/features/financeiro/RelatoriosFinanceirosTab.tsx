import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  RefreshCcw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAllCategoriasObras } from "@/hooks/useCategoriasObras";
import { financeiroService } from "@/services/financeiro.service";
import { getApiErrorMessage } from "@/lib/utils";
import type { CommissionReportJobStatusResponse } from "@/types/financeiro.types";

const MONTHS = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

const WAITING_MESSAGES = [
  "Separando as obras recebidas no período...",
  "Conferindo os últimos recebimentos de cada obra...",
  "Montando as fórmulas do Excel para você...",
  "Aplicando formatação e revisando os totais...",
  "Quase pronto, só mais alguns instantes...",
];

function getYears() {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 7 }, (_, index) => currentYear - 3 + index);
}

function formatElapsed(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes === 0) return `${rest}s`;
  return `${minutes}min ${String(rest).padStart(2, "0")}s`;
}

function getStatusLabel(status?: CommissionReportJobStatusResponse["status"]) {
  if (status === "processing") return "Processando";
  if (status === "completed") return "Pronto";
  if (status === "failed") return "Falhou";
  return "Na fila";
}

export function RelatoriosFinanceirosTab() {
  const now = new Date();
  const [categoriaId, setCategoriaId] = useState("");
  const [mes, setMes] = useState(String(now.getMonth() + 1));
  const [ano, setAno] = useState(String(now.getFullYear()));
  const [porcentagem, setPorcentagem] = useState("5");
  const [jobId, setJobId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  const years = useMemo(() => getYears(), []);
  const { data: categoriasData, isLoading: categoriasLoading } = useAllCategoriasObras();
  const categorias = categoriasData?.items ?? [];

  const reportMutation = useMutation({
    mutationFn: () =>
      financeiroService.createCommissionReport({
        categoria_id: categoriaId,
        mes: Number(mes),
        ano: Number(ano),
        porcentagem_comissao: (Number(porcentagem.replace(",", ".")) / 100).toFixed(4),
      }),
    onSuccess: (data) => {
      setJobId(data.job_id);
      setStartedAt(Date.now());
      setElapsedSeconds(0);
      setMessageIndex(0);
      toast.success("Relatório solicitado. Vamos avisar quando estiver pronto.");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const jobQuery = useQuery({
    queryKey: ["financeiro", "relatorios", "jobs", jobId],
    queryFn: () => financeiroService.getReportJobStatus(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "completed" || status === "failed") return false;
      return elapsedSeconds < 20 ? 2000 : 5000;
    },
  });

  const jobStatus = jobQuery.data;
  const isWaiting = !!jobId && jobStatus?.status !== "completed" && jobStatus?.status !== "failed";
  const isSlow = isWaiting && elapsedSeconds >= 120;
  const selectedMonth = MONTHS.find((item) => item.value === Number(mes));
  const canSubmit = !!categoriaId && Number(porcentagem.replace(",", ".")) >= 0;

  useEffect(() => {
    if (!isWaiting || !startedAt) return;

    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isWaiting, startedAt]);

  useEffect(() => {
    if (!isWaiting) return;

    const timer = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % WAITING_MESSAGES.length);
    }, 3500);

    return () => window.clearInterval(timer);
  }, [isWaiting]);

  useEffect(() => {
    if (jobStatus?.status === "completed" && jobStatus.file_url) {
      toast.success("Relatório pronto para download.");
    }
    if (jobStatus?.status === "failed") {
      toast.error(jobStatus.error_message ?? "Não foi possível gerar o relatório.");
    }
  }, [jobStatus?.status, jobStatus?.file_url, jobStatus?.error_message]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      toast.error("Preencha a categoria e uma porcentagem válida.");
      return;
    }
    reportMutation.mutate();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Relatório financeiro de obras recebidas</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Gere um Excel com obras 100% recebidas por categoria, mês e percentual de comissão.
              </p>
            </div>
            <div className="hidden h-11 w-11 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 sm:flex">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <Label>Categoria da obra</Label>
                {categoriasLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select value={categoriaId} onValueChange={setCategoriaId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((categoria) => (
                        <SelectItem key={categoria.id} value={categoria.id}>
                          <span className="inline-flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: categoria.cor ?? "#64748b" }}
                            />
                            {categoria.title}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Mes</Label>
                <Select value={mes} onValueChange={setMes}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((item) => (
                      <SelectItem key={item.value} value={String(item.value)}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Ano</Label>
                <Select value={ano} onValueChange={setAno}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label>Comissão (%)</Label>
                <div className="relative">
                  <Input
                    inputMode="decimal"
                    value={porcentagem}
                    onChange={(event) => setPorcentagem(event.target.value)}
                    className="pr-10"
                    placeholder="5"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                    %
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
              O arquivo será gerado em segundo plano. Enquanto isso, pode manter esta tela aberta para acompanhar o
              status e baixar quando finalizar.
            </div>

            <Button type="submit" disabled={!canSubmit || reportMutation.isPending || isWaiting} className="w-full sm:w-auto">
              {reportMutation.isPending || isWaiting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              {isWaiting ? "Gerando relatório" : "Gerar relatório"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="text-base">Acompanhamento</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!jobId ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Sparkles className="h-6 w-6" />
              </div>
              <p className="font-medium">Tudo pronto para gerar</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Escolha os filtros e eu acompanho o processamento por aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-5 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-semibold">{getStatusLabel(jobStatus?.status)}</p>
                </div>
                <span className="rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground">
                  {formatElapsed(elapsedSeconds)}
                </span>
              </div>

              {isWaiting && (
                <div className="relative overflow-hidden rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="absolute inset-x-0 top-0 h-1 overflow-hidden bg-primary/10">
                    <motion.div
                      className="h-full w-1/3 rounded-full bg-primary"
                      animate={{ x: ["-100%", "320%"] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-background text-primary shadow-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-ping rounded-full bg-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={isSlow ? "slow" : messageIndex}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.25 }}
                          className="font-medium"
                        >
                          {isSlow
                            ? "Isso está demorando mais que o normal, mas seguimos acompanhando."
                            : WAITING_MESSAGES[messageIndex]}
                        </motion.p>
                      </AnimatePresence>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedMonth?.label}/{ano} com {porcentagem}% de comissão.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {jobStatus?.status === "completed" && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-emerald-700 dark:text-emerald-300">Relatório pronto</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        O Excel foi gerado com fórmulas nativas para recalcular totais automaticamente.
                      </p>
                      {jobStatus.file_url && (
                        <Button asChild className="mt-4 w-full">
                          <a href={jobStatus.file_url} target="_blank" rel="noreferrer">
                            <Download className="h-4 w-4" />
                            Baixar Excel
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {jobStatus?.status === "failed" && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-destructive">Não foi possível gerar</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {jobStatus.error_message ?? "Tente novamente em instantes."}
                      </p>
                      <Button
                        variant="outline"
                        className="mt-4 w-full"
                        onClick={() => reportMutation.mutate()}
                        disabled={reportMutation.isPending}
                      >
                        <RefreshCcw className="h-4 w-4" />
                        Tentar novamente
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {jobQuery.isError && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-300">
                  Não consegui consultar o status agora. Vou tentar novamente automaticamente.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
