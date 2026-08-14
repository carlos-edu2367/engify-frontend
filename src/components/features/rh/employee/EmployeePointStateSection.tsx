import { useState } from "react";
import { CalendarDays, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDuracao } from "@/features/rh/shared/utils/formatters";
import type { RhEstadoPonto7Dias, RhResumoDiaPonto, RhSituacaoDia } from "@/types/rh.types";

type BadgeVariant = "secondary" | "destructive" | "outline" | "success" | "warning" | "info";

const SITUACOES_COM_PROBLEMA: RhSituacaoDia[] = ["falta", "incompleto", "parcial"];

const situacaoBadge: Record<RhSituacaoDia, { label: string; variant: BadgeVariant }> = {
  sem_expediente: { label: "Sem expediente", variant: "outline" },
  abonado: { label: "Abonado", variant: "info" },
  falta: { label: "Falta", variant: "destructive" },
  incompleto: { label: "Precisa de ajuste", variant: "warning" },
  parcial: { label: "Jornada incompleta", variant: "warning" },
  completo: { label: "Em dia", variant: "success" },
  extra: { label: "Hora extra", variant: "info" },
};

function descreverDia(dia: RhResumoDiaPonto): string {
  switch (dia.situacao) {
    case "falta":
      return `Sem registro de ponto. Esperado: ${formatDuracao(dia.minutos_esperados)}`;
    case "incompleto":
      return "Número ímpar de batidas — precisa de ajuste";
    case "parcial":
      return `Trabalhou ${formatDuracao(dia.minutos_trabalhados)} de ${formatDuracao(
        dia.minutos_esperados
      )} — faltam ${formatDuracao(dia.minutos_faltantes)}`;
    case "extra":
      return `Trabalhou ${formatDuracao(dia.minutos_trabalhados)} — ${formatDuracao(
        dia.minutos_extras
      )} de hora extra`;
    case "completo":
      return `Jornada cumprida — ${formatDuracao(dia.minutos_trabalhados)}`;
    case "abonado":
      return "Dia abonado (feriado ou abono)";
    default:
      return "";
  }
}

/**
 * Datas do resumo chegam como "AAAA-MM-DD". Se vier vazia ou fora do padrao, o
 * Intl lanca RangeError durante o render e a rota /meu-rh inteira cai no
 * errorElement — por isso o parse e checado antes de formatar.
 */
function parseDiaLocal(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }
  const data = new Date(`${value}T00:00:00`);
  return Number.isNaN(data.getTime()) ? null : data;
}

function formatDiaSemana(value: string): string {
  const data = parseDiaLocal(value);
  if (!data) {
    return value || "Data indisponivel";
  }
  const rotulo = new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(data);
  return rotulo.charAt(0).toUpperCase() + rotulo.slice(1);
}

function formatPeriodo(value: string): string {
  const data = parseDiaLocal(value);
  if (!data) {
    return value || "--/--/----";
  }
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(data);
}

/**
 * Novas situacoes de dia podem chegar antes desta tela conhecer o rotulo delas.
 * Sem esse fallback, `situacaoBadge[desconhecida]` e undefined e ler `.variant`
 * derruba o card inteiro.
 */
export function resolveSituacaoBadge(situacao: RhSituacaoDia): { label: string; variant: BadgeVariant } {
  return situacaoBadge[situacao] ?? { label: String(situacao ?? "Sem informacao"), variant: "secondary" };
}

function contar(valor: number, singular: string, plural: string): string {
  if (valor === 0) return "Nenhum";
  return `${valor} ${valor === 1 ? singular : plural}`;
}

function horasParaMinutos(valor: string): number {
  return Math.round(Number(valor || 0) * 60);
}

function DayRow({ dia }: { dia: RhResumoDiaPonto }) {
  const badge = resolveSituacaoBadge(dia.situacao);
  return (
    <div className="flex flex-col gap-1 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{formatDiaSemana(dia.data)}</span>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>
      <p className="text-xs text-muted-foreground sm:text-right">{descreverDia(dia)}</p>
    </div>
  );
}

function PointStateMetric({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-md border bg-muted/30 p-4">
      <p className="text-xs uppercase text-muted-foreground">{title}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function EmployeePointStateSection({ state }: { state?: RhEstadoPonto7Dias | null }) {
  const [mostrarTodos, setMostrarTodos] = useState(false);

  if (!state) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Seus últimos 7 dias</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="Resumo indisponível"
            description="Assim que houver horário e registros suficientes, o resumo aparecerá aqui."
            icon={<MapPin className="h-10 w-10" />}
          />
        </CardContent>
      </Card>
    );
  }

  const dias = state.dias ?? [];
  const comExpediente = dias.filter((dia) => dia.situacao !== "sem_expediente");
  const problematicos = comExpediente.filter((dia) => SITUACOES_COM_PROBLEMA.includes(dia.situacao));
  const visiveis = mostrarTodos ? comExpediente : problematicos;
  const inconsistentes = state.pontos_inconsistentes;

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <CalendarDays className="h-5 w-5" />
          Seus últimos 7 dias
        </CardTitle>
        <CardDescription>
          De {formatPeriodo(state.inicio)} a {formatPeriodo(state.fim)} — não inclui o dia de hoje.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <PointStateMetric title="Dias sem registro" value={contar(state.faltas, "dia", "dias")} />
          <PointStateMetric
            title="Horas extras"
            value={formatDuracao(horasParaMinutos(state.horas_extras))}
          />
          <PointStateMetric
            title="Horas a compensar"
            value={formatDuracao(horasParaMinutos(state.horas_faltantes))}
          />
          <PointStateMetric
            title="Registros que precisam de ajuste"
            value={contar(inconsistentes, "registro", "registros")}
            hint={
              inconsistentes > 0
                ? "São batidas que o sistema não conseguiu parear. Abra uma solicitação na aba Solicitações."
                : undefined
            }
          />
        </div>

        {comExpediente.length > 0 && (
          <div className="space-y-2">
            {problematicos.length > 0 && !mostrarTodos && (
              <p className="text-xs text-muted-foreground">
                Dias que precisam da sua atenção:
              </p>
            )}
            {visiveis.map((dia) => (
              <DayRow key={dia.data} dia={dia} />
            ))}
            {comExpediente.length > problematicos.length && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setMostrarTodos((atual) => !atual)}
              >
                {mostrarTodos ? "Mostrar só os dias com pendência" : "Ver todos os 7 dias"}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
