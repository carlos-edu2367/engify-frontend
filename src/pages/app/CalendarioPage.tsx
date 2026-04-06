import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { PageTransition } from "@/components/layout/PageTransition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatDate } from "@/lib/utils";
import { obrasService } from "@/services/obras.service";
import type { ObraResponse, ObraStatus } from "@/types/obra.types";

const statusVariants: Record<ObraStatus, "info" | "warning" | "success"> = {
  planejamento: "info",
  em_andamento: "warning",
  finalizado: "success",
};

const statusLabels: Record<ObraStatus, string> = {
  planejamento: "Planejamento",
  em_andamento: "Em andamento",
  finalizado: "Finalizado",
};

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function formatIcsDate(date: Date) {
  return format(date, "yyyyMMdd");
}

function formatIcsDateTimeUtc(date: Date) {
  // YYYYMMDDTHHMMSSZ
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function buildDeadlinesIcs(obras: ObraResponse[]) {
  const nowStamp = formatIcsDateTimeUtc(new Date());

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Engify//Calendario de Prazos//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const obra of obras) {
    if (!obra.data_entrega) continue;
    let entrega: Date;
    try {
      entrega = parseISO(obra.data_entrega);
    } catch {
      continue;
    }

    const dtStart = formatIcsDate(entrega);
    const dtEnd = formatIcsDate(addDays(entrega, 1));
    const uid = `obra-${obra.id}@engify`;

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${escapeIcsText(uid)}`);
    lines.push(`DTSTAMP:${nowStamp}`);
    lines.push(`DTSTART;VALUE=DATE:${dtStart}`);
    lines.push(`DTEND;VALUE=DATE:${dtEnd}`);
    lines.push(`SUMMARY:${escapeIcsText(`Prazo: ${obra.title}`)}`);
    lines.push(
      `DESCRIPTION:${escapeIcsText(
        `Status: ${statusLabels[obra.status]}\nPrazo: ${formatDate(obra.data_entrega)}`
      )}`
    );
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}

async function fetchAllObras(limit = 100) {
  const items: ObraResponse[] = [];
  let page = 1;
  let hasNext = true;
  let safety = 0;

  while (hasNext && safety < 25) {
    safety += 1;
    const res = await obrasService.list({ page, limit, status: "all" });
    items.push(...res.items);
    hasNext = res.has_next;
    page += 1;
  }

  return items;
}

export function CalendarioPage() {
  const navigate = useNavigate();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  const { data: obras = [], isLoading } = useQuery({
    queryKey: ["obras", "deadlines", { all: true }],
    queryFn: () => fetchAllObras(100),
  });

  const obrasComPrazo = useMemo(() => {
    return obras.filter((o) => !!o.data_entrega);
  }, [obras]);

  const deadlinesByDay = useMemo(() => {
    const map: Record<string, ObraResponse[]> = {};
    for (const obra of obrasComPrazo) {
      if (!obra.data_entrega) continue;
      let dt: Date;
      try {
        dt = parseISO(obra.data_entrega);
      } catch {
        continue;
      }
      const key = format(dt, "yyyy-MM-dd");
      map[key] = map[key] ? [...map[key], obra] : [obra];
    }

    // Ordena por status/título para consistência
    for (const key of Object.keys(map)) {
      map[key] = map[key]!.slice().sort((a, b) => {
        if (a.status !== b.status) return a.status.localeCompare(b.status);
        return a.title.localeCompare(b.title);
      });
    }

    return map;
  }, [obrasComPrazo]);

  const weeks = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    const days: Date[] = [];
    for (let d = start; d <= end; d = addDays(d, 1)) {
      days.push(d);
    }
    return days;
  }, [month]);

  function handleExportIcs() {
    const ics = buildDeadlinesIcs(obrasComPrazo);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "engify-prazos.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const today = new Date();
  const monthTitle = format(month, "MMMM yyyy", { locale: ptBR });

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Calendário</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Visualize os prazos (data de entrega) das obras e exporte para seu calendário.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button variant="outline" onClick={handleExportIcs} disabled={obrasComPrazo.length === 0}>
              <Download />
              Exportar prazos (.ics)
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg capitalize">{monthTitle}</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setMonth((m) => subMonths(m, 1))}>
                <ChevronLeft />
              </Button>
              <Button variant="outline" onClick={() => setMonth(startOfMonth(new Date()))}>
                Hoje
              </Button>
              <Button variant="outline" size="icon" onClick={() => setMonth((m) => addMonths(m, 1))}>
                <ChevronRight />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-40" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-7 gap-2 text-xs text-muted-foreground">
                  {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => (
                    <div key={d} className="px-1 font-medium">
                      {d}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {weeks.map((day) => {
                    const key = format(day, "yyyy-MM-dd");
                    const obrasDoDia = deadlinesByDay[key] ?? [];
                    const outsideMonth = !isSameMonth(day, month);
                    const isToday = isSameDay(day, today);

                    return (
                      <div
                        key={key}
                        className={cn(
                          "min-h-[92px] rounded-md border p-2",
                          outsideMonth && "bg-muted/30 text-muted-foreground",
                          isToday && "border-primary/60 bg-primary/5"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold">{format(day, "d")}</span>
                          {obrasDoDia.length > 0 && (
                            <span className="text-[11px] text-muted-foreground">
                              {obrasDoDia.length} prazo{obrasDoDia.length !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>

                        <div className="mt-2 space-y-1">
                          {obrasDoDia.slice(0, 2).map((obra) => (
                            <button
                              key={obra.id}
                              type="button"
                              onClick={() => navigate(`/obras/${obra.id}`)}
                              className={cn(
                                "w-full rounded-md border px-2 py-1 text-left text-xs hover:bg-accent",
                                statusVariants[obra.status] === "info" &&
                                  "border-blue-200 bg-blue-50/40 dark:border-blue-900/50 dark:bg-blue-900/10",
                                statusVariants[obra.status] === "warning" &&
                                  "border-amber-200 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-900/10",
                                statusVariants[obra.status] === "success" &&
                                  "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-900/10"
                              )}
                              title={`${obra.title} • ${statusLabels[obra.status]}`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="truncate font-medium">{obra.title}</span>
                                <span className="shrink-0 text-[10px] text-muted-foreground">
                                  {statusLabels[obra.status]}
                                </span>
                              </div>
                            </button>
                          ))}
                          {obrasDoDia.length > 2 && (
                            <div className="text-[11px] text-muted-foreground">
                              +{obrasDoDia.length - 2} outro{obrasDoDia.length - 2 !== 1 ? "s" : ""}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}

