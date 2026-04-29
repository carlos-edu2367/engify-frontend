import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { ScheduleRow } from "@/components/features/rh/rh-utils";

export function RhScheduleEditor({
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
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div>
        <p className="font-medium">Jornada de trabalho</p>
        <p className="text-sm text-muted-foreground">Ative os dias trabalhados e ajuste entrada, saida e intervalo quando houver.</p>
      </div>
      <div className="flex flex-col gap-2">
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
            <TimeField label="Entrada" value={row.hora_entrada} disabled={!row.enabled} onChange={(value) => updateRow(row.dia_semana, { hora_entrada: value })} />
            <TimeField label="Saida" value={row.hora_saida} disabled={!row.enabled} onChange={(value) => updateRow(row.dia_semana, { hora_saida: value })} />
            <TimeField label="Inicio intervalo" value={row.intervalo_inicio} disabled={!row.enabled} onChange={(value) => updateRow(row.dia_semana, { intervalo_inicio: value })} />
            <TimeField label="Fim intervalo" value={row.intervalo_fim} disabled={!row.enabled} onChange={(value) => updateRow(row.dia_semana, { intervalo_fim: value })} />
          </div>
        ))}
      </div>
    </div>
  );
}

function TimeField({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Input type="time" value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
