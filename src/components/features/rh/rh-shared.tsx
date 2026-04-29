import type { ReactNode } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCurrency } from "@/lib/utils";
import type { FuncionarioFormValues } from "@/lib/schemas/rh.schemas";
import type {
  RhAjustePonto,
  RhAtestado,
  RhAuditLog,
  RhDashboardSummary,
  RhFerias,
  RhHolerite,
  RhMeResumo,
  RhRegistroPonto,
} from "@/types/rh.types";
import { BadgeCheck, FileClock, FileSearch, MapPin, Shield, User, Wallet, XCircle } from "lucide-react";
import type { ScheduleRow } from "./rh-utils";
import { formatDateTime, timelineSubtitle, timelineTitle } from "./rh-utils";
import { useQuery } from "@tanstack/react-query";
import { usersService } from "@/services/users.service";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: ReactNode;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

export function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs uppercase text-muted-foreground">{title}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

export function QueueHeader({ icon, title, count }: { icon: ReactNode; title: string; count: number }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <Badge variant="secondary">{count}</Badge>
    </div>
  );
}

export function QueueEmpty({ text }: { text: string }) {
  return <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">{text}</div>;
}

export function ActionRow({
  title,
  subtitle,
  status,
  onApprove,
  onReject,
}: {
  title: string;
  subtitle: string;
  status: string;
  onApprove?: () => void;
  onReject?: () => void;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <Badge variant={statusBadgeVariant(status)}>{statusLabel(status)}</Badge>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        {onApprove && onReject ? (
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={onApprove}>
              <BadgeCheck className="h-4 w-4" />
              Aprovar
            </Button>
            <Button variant="outline" size="sm" onClick={onReject}>
              <XCircle className="h-4 w-4" />
              Rejeitar
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function AdminDashboardSection({
  summary,
  loading,
  competenciaMes,
  competenciaAno,
  onCompetenciaMesChange,
  onCompetenciaAnoChange,
}: {
  summary?: RhDashboardSummary;
  loading: boolean;
  competenciaMes: number;
  competenciaAno: number;
  onCompetenciaMesChange: (value: number) => void;
  onCompetenciaAnoChange: (value: number) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle className="text-xl">Dashboard RH</CardTitle>
            <CardDescription>
              Resumo rapido da operacao da competencia e dos gargalos que pedem acao imediata.
            </CardDescription>
          </div>
          <div className="flex gap-3">
            <Field label="Mes">
              <Input
                type="number"
                min={1}
                max={12}
                value={competenciaMes}
                onChange={(event) => onCompetenciaMesChange(Number(event.target.value))}
                className="w-24"
              />
            </Field>
            <Field label="Ano">
              <Input
                type="number"
                min={2020}
                max={2100}
                value={competenciaAno}
                onChange={(event) => onCompetenciaAnoChange(Number(event.target.value))}
                className="w-28"
              />
            </Field>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading || !summary ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-24" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Funcionarios ativos" value={summary.total_funcionarios_ativos} />
            <StatCard title="Ajustes pendentes" value={summary.ajustes_pendentes} />
            <StatCard title="Ferias em andamento" value={summary.ferias_em_andamento} />
            <StatCard title="Atestados aguardando" value={summary.atestados_aguardando} />
            <StatCard title="Atestados vencidos" value={summary.atestados_vencidos} />
            <StatCard title="Pontos negados" value={summary.pontos_negados_periodo} />
            <StatCard title="Pontos inconsistentes" value={summary.pontos_inconsistentes_periodo} />
            <StatCard title="Total liquido" value={formatCurrency(summary.total_liquido_competencia)} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function EmployeeSummarySection({ summary, loading }: { summary?: RhMeResumo; loading: boolean }) {
  if (loading || !summary) {
    return (
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardContent className="py-4">
          <p className="text-xs uppercase text-muted-foreground">Ultimo ponto</p>
          <p className="text-lg font-semibold">{summary.ultimo_ponto ? statusLabel(summary.ultimo_ponto.status) : "Sem registro"}</p>
          <p className="text-xs text-muted-foreground">
            {summary.ultimo_ponto ? formatDateTime(summary.ultimo_ponto.timestamp) : "Ainda nao ha batidas recentes"}
          </p>
        </CardContent>
      </Card>
      <StatCard title="Ajustes pendentes" value={summary.ajustes_pendentes} />
      <StatCard title="Ferias pendentes" value={summary.ferias_pendentes} />
      <Card>
        <CardContent className="py-4">
          <p className="text-xs uppercase text-muted-foreground">Ultimo holerite</p>
          <p className="text-lg font-semibold">
            {summary.ultimo_holerite_fechado
              ? formatCurrency(summary.ultimo_holerite_fechado.valor_liquido)
              : "Sem fechamento"}
          </p>
          <p className="text-xs text-muted-foreground">
            {summary.ultimo_holerite_fechado
              ? `${String(summary.ultimo_holerite_fechado.mes_referencia).padStart(2, "0")}/${summary.ultimo_holerite_fechado.ano_referencia}`
              : "Nenhum holerite fechado ainda"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function AuditSection({ items, loading }: { items: RhAuditLog[]; loading: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Shield className="h-5 w-5" />
          Auditoria
        </CardTitle>
        <CardDescription>Eventos recentes mascarados para investigacao operacional e compliance.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-16" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="Nenhum evento recente"
            description="Assim que o modulo registrar eventos sensiveis, eles aparecem aqui."
            icon={<FileSearch className="h-10 w-10" />}
          />
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-lg border p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium">{item.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.entity_type} - {item.actor_role} - {formatDateTime(item.created_at)}
                    </p>
                  </div>
                  <Badge variant="secondary">{item.request_id ?? "sem request_id"}</Badge>
                </div>
                {(item.before || item.after) && (
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <AuditPayload label="Antes" payload={item.before} />
                    <AuditPayload label="Depois" payload={item.after} />
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

function AuditPayload({ label, payload }: { label: string; payload?: Record<string, unknown> | null }) {
  return (
    <div className="rounded-md bg-muted/50 p-3 text-xs">
      <p className="mb-2 font-medium text-foreground">{label}</p>
      <pre className="overflow-x-auto whitespace-pre-wrap text-muted-foreground">
        {payload ? JSON.stringify(payload, null, 2) : "Sem dados"}
      </pre>
    </div>
  );
}

export function HistorySection({ items, loading }: { items: RhRegistroPonto[]; loading: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <MapPin className="h-5 w-5" />
          Historico de ponto
        </CardTitle>
        <CardDescription>Ultimos registros com status validado, negado ou inconsistente.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-16" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="Nenhum registro encontrado"
            description="Seus registros de ponto aparecerao aqui assim que a primeira batida for enviada."
            icon={<MapPin className="h-10 w-10" />}
          />
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex flex-col gap-2 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">{item.tipo === "entrada" ? "Entrada" : "Saida"}</p>
                  <p className="text-sm text-muted-foreground">{formatDateTime(item.timestamp)}</p>
                </div>
                <Badge variant={statusBadgeVariant(item.status)}>{statusLabel(item.status)}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function HoleritesSection({ items, loading }: { items: RhHolerite[]; loading: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Wallet className="h-5 w-5" />
          Meus holerites
        </CardTitle>
        <CardDescription>Consulta somente leitura dos ultimos fechamentos.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-16" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="Nenhum holerite disponivel"
            description="Os holerites fechados aparecem aqui assim que a competencia for concluida."
            icon={<Wallet className="h-10 w-10" />}
          />
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex flex-col gap-2 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">
                    {String(item.mes_referencia).padStart(2, "0")}/{item.ano_referencia}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Base {formatCurrency(item.salario_base)} - Extras {formatCurrency(item.horas_extras)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={statusBadgeVariant(item.status)}>{statusLabel(item.status)}</Badge>
                  <p className="font-semibold">{formatCurrency(item.valor_liquido)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function EmployeeRequestCard({
  title,
  description,
  children,
  actionLabel,
  actionDisabled,
  onSubmit,
}: {
  title: string;
  description: string;
  children: ReactNode;
  actionLabel: string;
  actionDisabled: boolean;
  onSubmit: () => void;
}) {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
        <Button onClick={onSubmit} disabled={actionDisabled}>
          {actionLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

export function EmployeeTimeline({
  items,
  loading,
  type,
  renderActions,
}: {
  items: RhAjustePonto[] | RhFerias[] | RhAtestado[];
  loading: boolean;
  type: "ajuste" | "ferias" | "atestado";
  renderActions?: (item: RhAjustePonto | RhFerias | RhAtestado) => ReactNode;
}) {
  const title =
    type === "ajuste" ? "Minhas solicitacoes de ajuste" : type === "ferias" ? "Minhas ferias" : "Meus atestados";

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-16" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="Nenhum item encontrado"
            description="Quando novos envios forem feitos, eles aparecerao aqui."
            icon={<FileClock className="h-10 w-10" />}
          />
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-lg border p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium">{timelineTitle(item, type)}</p>
                    <p className="text-sm text-muted-foreground">{timelineSubtitle(item, type)}</p>
                    {"motivo_rejeicao" in item && item.motivo_rejeicao ? (
                      <p className="mt-1 text-xs text-muted-foreground">{item.motivo_rejeicao}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    {renderActions ? renderActions(item) : null}
                    <Badge variant={statusBadgeVariant(item.status)}>{statusLabel(item.status)}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function FuncionarioFields({
  form,
  includeStatus = false,
  includeReason = false,
}: {
  form: UseFormReturn<FuncionarioFormValues>;
  includeStatus?: boolean;
  includeReason?: boolean;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Nome" error={form.formState.errors.nome?.message}>
        <Input {...form.register("nome")} />
      </Field>
      <Field label="CPF" error={form.formState.errors.cpf?.message}>
        <Input {...form.register("cpf")} />
      </Field>
      <Field label="Cargo" error={form.formState.errors.cargo?.message}>
        <Input {...form.register("cargo")} />
      </Field>
      <Field label="Salario base" error={form.formState.errors.salario_base?.message}>
        <Input {...form.register("salario_base")} />
      </Field>
      <Field label="Data de admissao" error={form.formState.errors.data_admissao?.message}>
        <Input type="date" {...form.register("data_admissao")} />
      </Field>
      <Field label="Usuario vinculado" error={form.formState.errors.user_id?.message}>
        <UserSelector
          value={form.watch("user_id") || ""}
          onChange={(val) => form.setValue("user_id", val)}
        />
      </Field>
      {includeReason ? (
        <div className="md:col-span-2">
          <Field label="Motivo da alteracao" error={form.formState.errors.reason?.message}>
            <Textarea rows={3} placeholder="Obrigatorio ao alterar salario." {...form.register("reason")} />
          </Field>
        </div>
      ) : null}
      {includeStatus ? (
        <div className="space-y-2 rounded-md border p-3">
          <Label className="text-sm">Status</Label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register("is_active")} />
            Funcionario ativo
          </label>
        </div>
      ) : null}
    </div>
  );
}

function UserSelector({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersService.list(),
  });

  return (
    <Select value={value || "none"} onValueChange={(val) => onChange(val === "none" ? "" : val)}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={isLoading ? "Carregando usuários..." : "Selecione um usuário..."} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Nenhum vínculo</SelectItem>
        {users.map((user) => (
          <SelectItem key={user.user_id} value={user.user_id}>
            <div className="flex flex-col">
              <span className="font-medium">{user.nome}</span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ScheduleEditor({
  schedule,
  onChange,
}: {
  schedule: ScheduleRow[];
  onChange: (schedule: ScheduleRow[]) => void;
}) {
  const updateRow = (diaSemana: number, updater: Partial<ScheduleRow>) => {
    onChange(schedule.map((row) => (row.dia_semana === diaSemana ? { ...row, ...updater } : row)));
  };

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div>
        <p className="font-medium">Horario de trabalho</p>
        <p className="text-sm text-muted-foreground">
          Ative os dias trabalhados e ajuste entrada, saida e intervalo quando houver.
        </p>
      </div>
      <div className="space-y-2">
        {schedule.map((row) => (
          <div
            key={row.dia_semana}
            className="grid items-center gap-3 rounded-md border p-3 md:grid-cols-[140px_100px_repeat(4,minmax(0,1fr))]"
          >
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={row.enabled}
                onChange={(event) => updateRow(row.dia_semana, { enabled: event.target.checked })}
              />
              {row.label}
            </label>
            <Badge variant={row.enabled ? "success" : "secondary"}>{row.enabled ? "Ativo" : "Folga"}</Badge>
            <Field label="Entrada">
              <Input
                type="time"
                value={row.hora_entrada}
                disabled={!row.enabled}
                onChange={(event) => updateRow(row.dia_semana, { hora_entrada: event.target.value })}
              />
            </Field>
            <Field label="Saida">
              <Input
                type="time"
                value={row.hora_saida}
                disabled={!row.enabled}
                onChange={(event) => updateRow(row.dia_semana, { hora_saida: event.target.value })}
              />
            </Field>
            <Field label="Inicio intervalo">
              <Input
                type="time"
                value={row.intervalo_inicio}
                disabled={!row.enabled}
                onChange={(event) => updateRow(row.dia_semana, { intervalo_inicio: event.target.value })}
              />
            </Field>
            <Field label="Fim intervalo">
              <Input
                type="time"
                value={row.intervalo_fim}
                disabled={!row.enabled}
                onChange={(event) => updateRow(row.dia_semana, { intervalo_fim: event.target.value })}
              />
            </Field>
          </div>
        ))}
      </div>
    </div>
  );
}

export function statusLabel(status: string) {
  const labels: Record<string, string> = {
    pendente: "Pendente",
    aprovado: "Aprovado",
    rejeitado: "Rejeitado",
    solicitado: "Solicitado",
    em_andamento: "Em andamento",
    concluido: "Concluido",
    cancelado: "Cancelado",
    aguardando_entrega: "Aguardando entrega",
    entregue: "Entregue",
    vencido: "Vencido",
    rascunho: "Rascunho",
    fechado: "Fechado",
    validado: "Validado",
    negado: "Negado",
    inconsistente: "Inconsistente",
    ajustado: "Ajustado",
  };
  return labels[status] ?? status;
}

export function statusBadgeVariant(status: string): "secondary" | "success" | "warning" | "destructive" | "info" {
  if (["aprovado", "entregue", "fechado", "validado", "ajustado"].includes(status)) {
    return "success";
  }
  if (["pendente", "solicitado", "aguardando_entrega", "rascunho", "em_andamento", "inconsistente"].includes(status)) {
    return "warning";
  }
  if (["rejeitado", "cancelado", "vencido", "negado"].includes(status)) {
    return "destructive";
  }
  return "secondary";
}
