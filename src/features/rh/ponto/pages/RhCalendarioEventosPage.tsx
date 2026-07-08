import { useMemo, useState } from "react";
import { CalendarDays, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/EmptyState";
import type { RhFuncionarioListItem, RhTipoEventoCalendario } from "@/types/rh.types";
import { EmployeeSearchSelect } from "../../shared/components/EmployeeSearchSelect";
import { PermissionGate } from "../../shared/components/PermissionGate";
import { RhPageHeader } from "../../shared/components/RhPageHeader";
import { employeeDisplay } from "../../shared/utils/display";
import { formatRhDate } from "../../shared/utils/formatters";
import {
  useCalendarioEventos,
  useCriarEventoCalendario,
  useRemoverEventoCalendario,
} from "../hooks/usePontoOperacional";

const tipoOptions: Array<{ value: RhTipoEventoCalendario; label: string }> = [
  { value: "feriado", label: "Feriado" },
  { value: "ponto_facultativo", label: "Ponto facultativo" },
  { value: "abono", label: "Abono" },
  { value: "liberacao_antecipada", label: "Liberacao antecipada" },
];

const tipoLabel: Record<RhTipoEventoCalendario, string> = {
  feriado: "Feriado",
  ponto_facultativo: "Ponto facultativo",
  abono: "Abono",
  liberacao_antecipada: "Liberacao antecipada",
};

function firstDayOfMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

function lastDayOfMonth(): string {
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, "0")}-${String(last.getDate()).padStart(2, "0")}`;
}

export function RhCalendarioEventosPage() {
  const [start, setStart] = useState(firstDayOfMonth());
  const [end, setEnd] = useState(lastDayOfMonth());
  const [tipo, setTipo] = useState<RhTipoEventoCalendario>("feriado");
  const [data, setData] = useState("");
  const [descricao, setDescricao] = useState("");
  const [horaCorte, setHoraCorte] = useState("");
  const [aplicaTodos, setAplicaTodos] = useState(true);
  const [selecionados, setSelecionados] = useState<RhFuncionarioListItem[]>([]);
  const [pendingEmployee, setPendingEmployee] = useState<RhFuncionarioListItem | null>(null);

  const eventosQuery = useCalendarioEventos(start, end);
  const criarEvento = useCriarEventoCalendario();
  const removerEvento = useRemoverEventoCalendario();
  const eventos = useMemo(() => eventosQuery.data ?? [], [eventosQuery.data]);

  const addFuncionario = (employee: RhFuncionarioListItem | null) => {
    if (!employee) return;
    setSelecionados((prev) => (prev.some((item) => item.id === employee.id) ? prev : [...prev, employee]));
    setPendingEmployee(null);
  };

  const removeFuncionario = (id: string) => {
    setSelecionados((prev) => prev.filter((item) => item.id !== id));
  };

  const canSubmit =
    !!data &&
    !!descricao.trim() &&
    (tipo !== "liberacao_antecipada" || !!horaCorte) &&
    (aplicaTodos || selecionados.length > 0);

  const handleCreate = () => {
    criarEvento.mutate(
      {
        tipo,
        data,
        descricao: descricao.trim(),
        hora_corte: tipo === "liberacao_antecipada" ? `${horaCorte}:00` : null,
        aplica_todos: aplicaTodos,
        funcionario_ids: aplicaTodos ? [] : selecionados.map((item) => item.id),
      },
      {
        onSuccess: () => {
          setData("");
          setDescricao("");
          setHoraCorte("");
          setSelecionados([]);
        },
      }
    );
  };

  return (
    <PermissionGate permission="rh.ponto.adjust" showDeniedState>
      <div className="flex flex-col gap-6">
        <RhPageHeader
          title="Calendario de eventos"
          description="Feriados, ponto facultativo, abono e liberacao antecipada aplicados a folha e ao painel de ponto."
        />

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Novo evento</CardTitle>
            <CardDescription>Escolha o tipo, a data e o escopo (todos ou funcionarios especificos).</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select value={tipo} onValueChange={(value) => setTipo(value as RhTipoEventoCalendario)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {tipoOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Data</Label>
                <Input type="date" value={data} onChange={(event) => setData(event.target.value)} />
              </div>
              {tipo === "liberacao_antecipada" ? (
                <div className="space-y-1.5">
                  <Label>Hora de corte</Label>
                  <Input type="time" value={horaCorte} onChange={(event) => setHoraCorte(event.target.value)} />
                </div>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label>Descricao</Label>
              <Textarea value={descricao} onChange={(event) => setDescricao(event.target.value)} rows={2} placeholder="Ex.: Feriado municipal" />
            </div>

            <div className="space-y-2 rounded-md border p-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" checked={aplicaTodos} onChange={(event) => setAplicaTodos(event.target.checked)} />
                Aplicar a todos os funcionarios
              </label>
              {!aplicaTodos ? (
                <div className="space-y-2 pt-2">
                  <EmployeeSearchSelect value={pendingEmployee} onChange={addFuncionario} placeholder="Adicionar funcionario ao evento" />
                  {selecionados.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selecionados.map((item) => {
                        const display = employeeDisplay(item);
                        return (
                          <Badge key={item.id} variant="secondary" className="flex items-center gap-2">
                            {display.title}
                            <button type="button" onClick={() => removeFuncionario(item.id)} aria-label={`Remover ${display.title}`}>
                              <Trash2 className="size-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Nenhum funcionario selecionado ainda.</p>
                  )}
                </div>
              ) : null}
            </div>

            <Button disabled={!canSubmit || criarEvento.isPending} onClick={handleCreate}>
              {criarEvento.isPending ? "Criando..." : "Criar evento"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Eventos do periodo</CardTitle>
            <CardDescription>Ajuste o periodo para ver eventos de outros meses.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Inicio</Label>
                <Input type="date" value={start} onChange={(event) => setStart(event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Fim</Label>
                <Input type="date" value={end} onChange={(event) => setEnd(event.target.value)} />
              </div>
            </div>

            {eventosQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando eventos...</p>
            ) : eventos.length === 0 ? (
              <EmptyState
                title="Nenhum evento neste periodo"
                description="Crie um feriado, abono ou liberacao antecipada acima."
                icon={<CalendarDays className="h-10 w-10" />}
              />
            ) : (
              <div className="space-y-2">
                {eventos.map((evento) => (
                  <div key={evento.id} className="flex flex-col gap-2 rounded-lg border p-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium">
                        {tipoLabel[evento.tipo]} · {formatRhDate(evento.data)}
                        {evento.hora_corte ? ` · corte ${evento.hora_corte.slice(0, 5)}` : ""}
                      </p>
                      <p className="text-sm text-muted-foreground">{evento.descricao}</p>
                      <p className="text-xs text-muted-foreground">
                        {evento.aplica_todos ? "Todos os funcionarios" : `${evento.funcionario_ids.length} funcionario(s)`}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={removerEvento.isPending}
                      onClick={() => removerEvento.mutate(evento.id)}
                    >
                      <Trash2 className="size-4" />
                      Remover
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PermissionGate>
  );
}
