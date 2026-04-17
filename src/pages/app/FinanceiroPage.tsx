import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, TrendingUp, TrendingDown, CheckCircle2, Copy, ChevronDown, ChevronUp, Building2, ChevronRight, Receipt, CheckCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageTransition } from "@/components/layout/PageTransition";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { financeiroService } from "@/services/financeiro.service";
import {
  movimentacaoSchema,
  pagamentoSchema,
  type MovimentacaoFormValues,
  type PagamentoFormValues,
} from "@/lib/schemas/financeiro.schemas";
import { formatISO, parseISO, format, isToday, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency, formatDate, getApiErrorMessage } from "@/lib/utils";
import type { MovClass, MovimentacaoResponse, PagamentoResponse, PagamentoStatus } from "@/types/financeiro.types";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { obrasService } from "@/services/obras.service";
import { MovimentacaoDetailSheet } from "@/components/features/financeiro/MovimentacaoDetailSheet";
import { PixQrCodeBlock } from "@/components/features/financeiro/PixQrCodeBlock";
import { buildPixPayload } from "@/lib/pix";
import { teamsService } from "@/services/teams.service";
import type { DiaristResponse } from "@/types/team.types";

function getDueStatus(dataAgendada: string | undefined, status: string): "today" | "overdue" | null {
  if (!dataAgendada || status !== "aguardando") return null;
  const due = startOfDay(parseISO(dataAgendada));
  if (isToday(due)) return "today";
  if (isBefore(due, startOfDay(new Date()))) return "overdue";
  return null;
}

function DueBadge({ status }: { status: "today" | "overdue" }) {
  if (status === "today") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
        Vence hoje
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
      Atrasado
    </span>
  );
}

const classeLabels: Record<MovClass, string> = {
  diarista: "Diarista",
  servico: "Serviço",
  contrato: "Contrato",
  material: "Material",
  fixo: "Fixo",
  operacional: "Operacional",
};

// ─── PIX Code Copy Button ────────────────────────────────────────────────────
// ─── PIX Block inside a payment card ─────────────────────────────────────────
// ─── Types and Grouping Component ────────────────────────────────────────────
interface PagamentoGroup {
  type: "group";
  diarist_id: string;
  diarist_title: string;
  total_valor: number;
  data_agendada?: string;
  obra_id?: string;
  items: PagamentoResponse[];
  pix_payload?: string;
  pix_key?: string;
}

interface PagamentoSingle {
  type: "single";
  item: PagamentoResponse;
}

type RenderablePagamento = PagamentoGroup | PagamentoSingle;

interface PayAllPreview {
  ids: string[];
  diaristTitle: string;
  totalValor: number;
  itemCount: number;
  pixPayload?: string;
  pixKey?: string;
}

function GroupedPaymentCard({
  group,
  onPay,
  onPayAll,
}: {
  group: PagamentoGroup;
  onPay: (id: string) => void;
  onPayAll: (group: PagamentoGroup) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  const dateLabel = group.data_agendada
    ? format(parseISO(group.data_agendada), "EEEE", { locale: ptBR })
    : null;

  const dueStatus = getDueStatus(group.data_agendada, "aguardando");

  const borderClass = dueStatus === "overdue"
    ? "border-red-500/40"
    : dueStatus === "today"
    ? "border-amber-500/40"
    : "border-emerald-500/30";

  return (
    <Card className={`${borderClass} shadow-sm`}>
      <CardContent className="py-4 space-y-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium">
                {group.diarist_title}
                {dateLabel && (
                  <span className="font-normal text-muted-foreground"> — {dateLabel}</span>
                )}
              </p>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-primary/30 text-primary/70 bg-primary/5">
                {group.items.length} diárias
              </Badge>
              {dueStatus && <DueBadge status={dueStatus} />}
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <p className="text-xs text-muted-foreground">
                Pagamentos pendentes agendados para este diarista
              </p>
              {group.obra_id && (
                <button
                  onClick={() => navigate(`/obras/${group.obra_id}`)}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  <Building2 className="h-3 w-3" />
                  Ver Obra
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <p className="font-bold">{formatCurrency(group.total_valor.toString())}</p>
            <Button
              size="sm"
              variant="outline"
              className="text-emerald-600 border-emerald-500/40 hover:bg-emerald-500/10 hidden sm:flex"
              onClick={() => onPayAll(group)}
              title="Pagar tudo deste diarista"
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Pagar todos
            </Button>
            <Button size="sm" variant="outline" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 space-y-2 border-t pt-4">
            <div className="flex sm:hidden justify-end mb-2">
              <Button
                size="sm"
                variant="outline"
                className="text-emerald-600 border-emerald-500/40 hover:bg-emerald-500/10"
                onClick={() => onPayAll(group)}
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1" />
                Pagar todos
              </Button>
            </div>
            {group.items.map((p) => (
              <div key={p.id} className="rounded-md border border-border/50 bg-muted/20 p-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{p.details || "Diária"}</p>
                    {p.data_agendada && (
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <p className="text-xs text-muted-foreground">
                          Vencimento: {formatDate(p.data_agendada)}
                        </p>
                        {getDueStatus(p.data_agendada, p.status) && (
                          <DueBadge status={getDueStatus(p.data_agendada, p.status)!} />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <p className="text-sm font-bold">{formatCurrency(p.valor)}</p>
                    <Button size="sm" onClick={() => onPay(p.id)}>
                      Pagar
                    </Button>
                  </div>
                </div>
                {p.status === "aguardando" && p.pix_copy_and_past && (
                  <div className="mt-3">
                    <PixQrCodeBlock payload={p.pix_copy_and_past} originalCode={p.payment_cod} compact />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function FinanceiroPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [createMovOpen, setCreateMovOpen] = useState(false);
  const [createPagOpen, setCreatePagOpen] = useState(false);
  const [confirmPayId, setConfirmPayId] = useState<string | null>(null);
  const [payAllPreview, setPayAllPreview] = useState<PayAllPreview | null>(null);
  const [selectedMov, setSelectedMov] = useState<MovimentacaoResponse | null>(null);
  const [movFormObraId, setMovFormObraId] = useState<string>("");

  // Filtros de Movimentações
  const [movPeriodo, setMovPeriodo] = useState<{ start: string; end: string }>({ start: "", end: "" });
  const [movObraId, setMovObraId] = useState<string>("");
  const [movClasse, setMovClasse] = useState<MovClass | "all">("all");

  // Filtros de Pagamentos
  const [pagStatus, setPagStatus] = useState<PagamentoStatus | "all">("all");

  // Obras para o filtro
  const { data: obrasData } = useQuery({
    queryKey: ["obras", "all"],
    queryFn: () => obrasService.list({ limit: 50, status: "all" }),
  });
  const { data: diaristasData } = useQuery({
    queryKey: ["diaristas"],
    queryFn: () => teamsService.getDiaristas(1, 200),
  });
  const obrasOptions = (obrasData?.items ?? []).map((o) => ({ value: o.id, label: o.title }));
  const diaristasMap = Object.fromEntries(
    ((diaristasData?.items ?? []) as DiaristResponse[]).map((d) => [d.id, d])
  );

  const { data: movsData, isLoading: movsLoading } = useQuery({
    queryKey: ["financeiro", "movimentacoes", { pStart: movPeriodo.start, pEnd: movPeriodo.end, obra: movObraId, classe: movClasse }],
    queryFn: () =>
      financeiroService.listMovimentacoes({
        limit: 50,
        period_start: movPeriodo.start ? new Date(movPeriodo.start).toISOString() : undefined,
        period_end: movPeriodo.end ? new Date(movPeriodo.end + "T23:59:59").toISOString() : undefined,
        obra_id: movObraId || undefined,
        classe: movClasse,
      }),
  });

  const { data: pagsData, isLoading: pagsLoading } = useQuery({
    queryKey: ["financeiro", "pagamentos", { status: pagStatus }],
    queryFn: () => financeiroService.listPagamentos({ limit: 50, status: pagStatus }),
  });

  const createMovMutation = useMutation({
    mutationFn: (v: MovimentacaoFormValues) => financeiroService.createMovimentacao(v),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financeiro"] });
      toast.success("Movimentação registrada!");
      setCreateMovOpen(false);
      setMovFormObraId("");
      resetMov();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const createPagMutation = useMutation({
    mutationFn: (v: PagamentoFormValues) =>
      financeiroService.createPagamento({
        ...v,
        data_agendada: v.data_agendada
          ? formatISO(parseISO(v.data_agendada))
          : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financeiro"] });
      toast.success("Pagamento agendado!");
      setCreatePagOpen(false);
      resetPag();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const payMutation = useMutation({
    mutationFn: (id: string) => financeiroService.payPagamento(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financeiro"] });
      toast.success("Pagamento efetuado!");
      setConfirmPayId(null);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const baixaLoteMutation = useMutation({
    mutationFn: (ids: string[]) => financeiroService.baixaLotePagamentos({ pagamento_ids: ids }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["financeiro"] });
      toast.success(`${result.quantidade} pagamentos marcados como pagos — ${formatCurrency(result.valor_total.toString())}`);
      setPayAllPreview(null);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const {
    register: registerMov,
    handleSubmit: handleSubmitMov,
    setValue: setValueMov,
    reset: resetMov,
    formState: { errors: errorsMov },
  } = useForm<MovimentacaoFormValues>({ resolver: zodResolver(movimentacaoSchema) });

  const {
    register: registerPag,
    handleSubmit: handleSubmitPag,
    setValue: setValuePag,
    reset: resetPag,
    formState: { errors: errorsPag },
  } = useForm<PagamentoFormValues>({ resolver: zodResolver(pagamentoSchema) });

  const movs = movsData?.items ?? [];
  const pags = pagsData?.items ?? [];
  const totalEntradas = movs.filter((m) => m.type === "entrada").reduce((s, m) => s + parseFloat(m.valor), 0);
  const totalSaidas = movs.filter((m) => m.type === "saida").reduce((s, m) => s + parseFloat(m.valor), 0);
  const pendentes = pags.filter((p) => p.status === "aguardando");

  const renderPags: RenderablePagamento[] = [];
  // Key: `${diarist_id}|${dateKey}` to group by diarist AND day
  const pendingByDiaristaAndDate = new Map<string, PagamentoResponse[]>();

  pags.forEach((p) => {
    if (p.status === "aguardando" && p.classe === "diarista" && p.diarist_id) {
      const dateKey = p.data_agendada
        ? format(parseISO(p.data_agendada), "yyyy-MM-dd")
        : "sem-data";
      const groupKey = `${p.diarist_id}|${dateKey}`;
      if (!pendingByDiaristaAndDate.has(groupKey)) {
        pendingByDiaristaAndDate.set(groupKey, []);
      }
      pendingByDiaristaAndDate.get(groupKey)!.push(p);
    } else {
      renderPags.push({ type: "single", item: p });
    }
  });

  pendingByDiaristaAndDate.forEach((groupItems) => {
    if (groupItems.length === 1) {
      renderPags.push({ type: "single", item: groupItems[0] });
    } else {
      const total = groupItems.reduce((acc, p) => acc + parseFloat(p.valor), 0);
      const diarista = diaristasMap[groupItems[0].diarist_id!];
      const pixKey = diarista?.chave_pix?.trim();
      const pixPayload = pixKey
        ? buildPixPayload({
            pixKey,
            amount: total,
            recipientName: diarista?.nome || groupItems[0].title,
            description: `Pagamento ${groupItems.length} diarias`,
            txid: groupItems[0].diarist_id?.replace(/-/g, "").slice(0, 25) || "***",
          })
        : undefined;
      renderPags.push({
        type: "group",
        diarist_id: groupItems[0].diarist_id!,
        diarist_title: groupItems[0].title,
        total_valor: total,
        data_agendada: groupItems[0].data_agendada,
        obra_id: groupItems[0].obra_id,
        items: groupItems,
        pix_payload: pixPayload,
        pix_key: pixKey,
      });
    }
  });

  return (
    <PageTransition>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Financeiro</h1>

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground font-normal">Entradas</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalEntradas)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground font-normal">Saídas</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-destructive">{formatCurrency(totalSaidas)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground font-normal">Pagamentos Pendentes</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">{pendentes.length}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="movimentacoes">
          <TabsList>
            <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
            <TabsTrigger value="pagamentos">
              Pagamentos
              {pendentes.length > 0 && (
                <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-xs text-white">
                  {pendentes.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Movimentações */}
          <TabsContent value="movimentacoes" className="mt-4 space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-lg border bg-card p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                  <Input 
                    type="date" 
                    value={movPeriodo.start} 
                    onChange={(e) => setMovPeriodo(prev => ({ ...prev, start: e.target.value }))}
                    className="h-9 w-36 text-xs" 
                    title="Data Inicial"
                  />
                  <span className="text-muted-foreground text-xs">até</span>
                  <Input 
                    type="date" 
                    value={movPeriodo.end} 
                    onChange={(e) => setMovPeriodo(prev => ({ ...prev, end: e.target.value }))}
                    className="h-9 w-36 text-xs" 
                    title="Data Final"
                  />
                </div>
                
                <div className="w-full sm:w-56">
                  <SearchableSelect 
                    options={obrasOptions} 
                    value={movObraId} 
                    onChange={setMovObraId} 
                    allOptionLabel="Todas as obras"
                    placeholder="Filtrar por obra..."
                  />
                </div>

                <div className="w-full sm:w-40">
                  <Select value={movClasse} onValueChange={(v) => setMovClasse(v as MovClass | "all")}>
                    <SelectTrigger className="h-9 truncate"><SelectValue placeholder="Classe" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas classes</SelectItem>
                      {Object.entries(classeLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button size="sm" onClick={() => setCreateMovOpen(true)} className="shrink-0">
                <Plus className="h-4 w-4 mr-1" />
                Nova Movimentação
              </Button>
            </div>
            
            {movsLoading ? (
              <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
            ) : movs.length === 0 ? (
              <div className="py-12 text-center border rounded-lg bg-card text-muted-foreground text-sm">
                Nenhuma movimentação encontrada com os filtros atuais.
              </div>
            ) : (
              <div className="space-y-2">
                {movs.map((m) => (
                  <Card
                    key={m.id}
                    className="cursor-pointer hover:border-primary/40 hover:shadow-md transition-all"
                    onClick={() => setSelectedMov(m)}
                  >
                    <CardContent className="flex items-center justify-between gap-4 py-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium truncate">{m.title}</p>
                          {m.obra_id && (
                            <span className="flex items-center gap-0.5 text-[10px] text-primary/70 border border-primary/20 rounded px-1 py-0.5 bg-primary/5 shrink-0">
                              <Building2 className="h-2.5 w-2.5" />
                              Obra
                            </span>
                          )}
                          {m.pagamento_id && (
                            <span className="flex items-center gap-0.5 text-[10px] text-amber-600 border border-amber-500/20 rounded px-1 py-0.5 bg-amber-500/5 shrink-0">
                              <Receipt className="h-2.5 w-2.5" />
                              Agendado
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {classeLabels[m.classe]} · {formatDate(m.data_movimentacao)}
                          {m.natureza === "open_finance" && (
                            <span className="ml-1.5 text-blue-500">· Open Finance</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <p className={m.type === "entrada" ? "font-bold text-emerald-600 dark:text-emerald-400" : "font-bold text-destructive"}>
                          {m.type === "entrada" ? "+" : "−"}{formatCurrency(m.valor)}
                        </p>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Pagamentos */}
          <TabsContent value="pagamentos" className="mt-4 space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-lg border bg-card p-4">
              <div className="flex sm:w-48">
                <Select value={pagStatus} onValueChange={(v) => setPagStatus(v as PagamentoStatus | "all")}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="aguardando">Pendentes</SelectItem>
                    <SelectItem value="pago">Pagos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button size="sm" onClick={() => setCreatePagOpen(true)} className="shrink-0">
                <Plus className="h-4 w-4 mr-1" />
                Novo Pagamento
              </Button>
            </div>
            
            {pagsLoading ? (
              <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
            ) : renderPags.length === 0 ? (
              <div className="py-12 text-center border rounded-lg bg-card text-muted-foreground text-sm">
                Nenhum pagamento encontrado com os filtros atuais.
              </div>
            ) : (
              <div className="space-y-3">
                {renderPags.map((r) => {
                  if (r.type === "group") {
                    const groupKey = `group-${r.diarist_id}-${r.data_agendada ?? "sem-data"}`;
                    return (
                      <GroupedPaymentCard
                        key={groupKey}
                        group={r}
                        onPay={setConfirmPayId}
                        onPayAll={(group) =>
                          setPayAllPreview({
                            ids: group.items.map((item) => item.id),
                            diaristTitle: group.diarist_title,
                            totalValor: group.total_valor,
                            itemCount: group.items.length,
                            pixPayload: group.pix_payload,
                            pixKey: group.pix_key,
                          })
                        }
                      />
                    );
                  }

                  const p = r.item;
                  const singleDueStatus = getDueStatus(p.data_agendada, p.status);
                  const singleBorder = singleDueStatus === "overdue"
                    ? "border-red-500/40"
                    : singleDueStatus === "today"
                    ? "border-amber-500/40"
                    : p.status === "aguardando" && p.payment_cod
                    ? "border-emerald-500/30"
                    : "";
                  return (
                    <Card
                      key={p.id}
                      className={`shadow-sm ${singleBorder}`}
                    >
                      <CardContent className="py-4 space-y-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium">{p.title}</p>
                              {p.classe === "diarista" && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-primary/30 text-primary/70">
                                  Diarista
                                </Badge>
                              )}
                            </div>
                            {p.details && (
                              <p className="text-xs text-muted-foreground truncate mt-0.5">{p.details}</p>
                            )}
                            <div className="flex items-center gap-3 flex-wrap mt-0.5">
                              {p.data_agendada && (
                                <p className="text-xs text-muted-foreground">
                                  Vencimento: {formatDate(p.data_agendada)}
                                </p>
                              )}
                              {singleDueStatus && <DueBadge status={singleDueStatus} />}
                              {p.obra_id && (
                                <button
                                  onClick={() => navigate(`/obras/${p.obra_id}`)}
                                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                                >
                                  <Building2 className="h-3 w-3" />
                                  Ver Obra
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <p className="font-bold">{formatCurrency(p.valor)}</p>
                            {p.status === "aguardando" ? (
                              <Button size="sm" onClick={() => setConfirmPayId(p.id)}>
                                Pagar
                              </Button>
                            ) : (
                              <Badge variant="success">Pago</Badge>
                            )}
                          </div>
                        </div>

                        {p.payment_cod && (
                          <div className="mt-2">
                            <button
                              onClick={() =>
                                navigator.clipboard.writeText(p.payment_cod!).then(() => {
                                  toast.success("CÃ³digo de pagamento copiado!");
                                })
                              }
                              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
                              title="Copiar cÃ³digo original"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              <span className="font-mono truncate max-w-[260px]">{p.payment_cod}</span>
                            </button>
                          </div>
                        )}
                        {p.status === "aguardando" && p.pix_copy_and_past && (
                          <div className="mt-2">
                            <PixQrCodeBlock payload={p.pix_copy_and_past} originalCode={p.payment_cod} />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog criar movimentação */}
      <Dialog open={createMovOpen} onOpenChange={setCreateMovOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Movimentação</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmitMov((v) => createMovMutation.mutate(v))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Título *</Label>
              <Input placeholder="Ex: Compra de cimento" {...registerMov("title")} />
              {errorsMov.title && <p className="text-xs text-destructive">{errorsMov.title.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Tipo *</Label>
                <Select onValueChange={(v) => setValueMov("type", v as "entrada" | "saida")}>
                  <SelectTrigger><SelectValue placeholder="Tipo..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Classe *</Label>
                <Select onValueChange={(v) => setValueMov("classe", v as MovClass)}>
                  <SelectTrigger><SelectValue placeholder="Classe..." /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(classeLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Valor *</Label>
              <Input placeholder="3200.00" {...registerMov("valor")} />
            </div>
            <div className="space-y-1.5">
              <Label>Obra (opcional)</Label>
              <SearchableSelect
                options={obrasOptions}
                value={movFormObraId}
                onChange={(v) => { setMovFormObraId(v); setValueMov("obra_id", v || undefined); }}
                allOptionLabel="Nenhuma obra"
                placeholder="Vincular a uma obra..."
              />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => { setCreateMovOpen(false); setMovFormObraId(""); }}>Cancelar</Button>
              <Button type="submit" disabled={createMovMutation.isPending}>
                {createMovMutation.isPending ? "Registrando..." : "Registrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog criar pagamento */}
      <Dialog open={createPagOpen} onOpenChange={setCreatePagOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Pagamento</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmitPag((v) => createPagMutation.mutate(v))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Título *</Label>
              <Input placeholder="Ex: Aluguel do escritório" {...registerPag("title")} />
              {errorsPag.title && <p className="text-xs text-destructive">{errorsPag.title.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Detalhes (opcional)</Label>
              <Input placeholder="Referente a..." {...registerPag("details")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Valor *</Label>
                <Input placeholder="4500.00" {...registerPag("valor")} />
              </div>
              <div className="space-y-1.5">
                <Label>Classe *</Label>
                <Select onValueChange={(v) => setValuePag("classe", v as MovClass)}>
                  <SelectTrigger><SelectValue placeholder="Classe..." /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(classeLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Data de vencimento (opcional)</Label>
              <Input type="date" {...registerPag("data_agendada")} />
            </div>
            <div className="space-y-1.5">
              <Label>Código de pagamento (opcional)</Label>
              <Input placeholder="PIX copia e cola, código de barras..." {...registerPag("payment_cod")} />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setCreatePagOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createPagMutation.isPending}>
                {createPagMutation.isPending ? "Agendando..." : "Agendar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail sheet de movimentação */}
      <MovimentacaoDetailSheet
        mov={selectedMov}
        onClose={() => setSelectedMov(null)}
      />

      {/* Confirmar pagamento */}
      <ConfirmDialog
        open={!!confirmPayId}
        onOpenChange={(o) => !o && setConfirmPayId(null)}
        title="Confirmar pagamento"
        description="Esta ação irá marcar o pagamento como pago e criar uma movimentação de saída. Não pode ser desfeita."
        confirmLabel="Confirmar pagamento"
        onConfirm={() => confirmPayId && payMutation.mutate(confirmPayId)}
        loading={payMutation.isPending}
      />

      <Dialog open={!!payAllPreview} onOpenChange={(o) => !o && setPayAllPreview(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pagar todas as diárias</DialogTitle>
          </DialogHeader>

          {payAllPreview && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{payAllPreview.diaristTitle}</p>
                    <p className="text-sm text-muted-foreground">
                      {payAllPreview.itemCount} pagamento{payAllPreview.itemCount !== 1 ? "s" : ""} consolidados neste lote
                    </p>
                  </div>
                  <p className="text-lg font-bold">{formatCurrency(payAllPreview.totalValor.toString())}</p>
                </div>
              </div>

              {payAllPreview.pixPayload ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Use o QR Code ou o PIX copia e cola abaixo para pagar o valor total deste grupo.
                  </p>
                  <PixQrCodeBlock payload={payAllPreview.pixPayload} originalCode={payAllPreview.pixKey} />
                </div>
              ) : (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-700 dark:text-amber-300">
                  Este diarista ainda não tem uma chave PIX cadastrada, então não foi possível gerar um QR Code consolidado no front-end.
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setPayAllPreview(null)}>
                  Fechar
                </Button>
                <Button
                  onClick={() => baixaLoteMutation.mutate(payAllPreview.ids)}
                  disabled={baixaLoteMutation.isPending}
                >
                  {baixaLoteMutation.isPending ? "Confirmando..." : "Marcar todos como pagos"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
