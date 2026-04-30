import type {
  RhAjustePonto,
  RhAtestado,
  RhFerias,
  RhTurnoHorario,
} from "@/types/rh.types";

export type ScheduleRow = {
  dia_semana: number;
  label: string;
  enabled: boolean;
  hora_entrada: string;
  hora_saida: string;
  intervalo_inicio: string;
  intervalo_fim: string;
};

export type EmployeeFormsState = {
  ajusteDataReferencia: string;
  ajusteJustificativa: string;
  ajusteEntrada: string;
  ajusteSaida: string;
  feriasInicio: string;
  feriasFim: string;
  atestadoTipoId: string;
  atestadoInicio: string;
  atestadoFim: string;
  atestadoArquivo: string;
};

const weekDays = [
  { dia_semana: 0, label: "Segunda" },
  { dia_semana: 1, label: "Terca" },
  { dia_semana: 2, label: "Quarta" },
  { dia_semana: 3, label: "Quinta" },
  { dia_semana: 4, label: "Sexta" },
  { dia_semana: 5, label: "Sabado" },
  { dia_semana: 6, label: "Domingo" },
] as const;

const defaultWeekdaySchedule = {
  hora_entrada: "08:00",
  hora_saida: "18:00",
  intervalo_inicio: "12:00",
  intervalo_fim: "14:00",
};

export function buildDefaultSchedule(): ScheduleRow[] {
  return weekDays.map((day, index) => ({
    ...day,
    enabled: index < 5,
    ...defaultWeekdaySchedule,
  }));
}

export function buildScheduleFromTurnos(turnos: RhTurnoHorario[] | undefined): ScheduleRow[] {
  if (!turnos?.length) {
    return buildDefaultSchedule();
  }

  const map = new Map((turnos ?? []).map((turno) => [turno.dia_semana, turno]));
  return weekDays.map((day) => {
    const turno = map.get(day.dia_semana);
    const intervalo = turno?.intervalos?.[0];
    return {
      ...day,
      enabled: !!turno,
      hora_entrada: turno?.hora_entrada?.slice(0, 5) ?? defaultWeekdaySchedule.hora_entrada,
      hora_saida: turno?.hora_saida?.slice(0, 5) ?? defaultWeekdaySchedule.hora_saida,
      intervalo_inicio: intervalo?.hora_inicio?.slice(0, 5) ?? defaultWeekdaySchedule.intervalo_inicio,
      intervalo_fim: intervalo?.hora_fim?.slice(0, 5) ?? defaultWeekdaySchedule.intervalo_fim,
    };
  });
}

export function extractTurnos(schedule: ScheduleRow[]): RhTurnoHorario[] {
  return schedule
    .filter((row) => row.enabled)
    .map((row) => ({
      dia_semana: row.dia_semana,
      hora_entrada: `${row.hora_entrada}:00`,
      hora_saida: `${row.hora_saida}:00`,
      intervalos:
        row.intervalo_inicio && row.intervalo_fim
          ? [
              {
                hora_inicio: `${row.intervalo_inicio}:00`,
                hora_fim: `${row.intervalo_fim}:00`,
              },
            ]
          : [],
    }));
}

export function buildEmptyEmployeeForms(): EmployeeFormsState {
  return {
    ajusteDataReferencia: "",
    ajusteJustificativa: "",
    ajusteEntrada: "",
    ajusteSaida: "",
    feriasInicio: "",
    feriasFim: "",
    atestadoTipoId: "",
    atestadoInicio: "",
    atestadoFim: "",
    atestadoArquivo: "",
  };
}

export function buildDateStart(value: string) {
  return `${value}T00:00:00.000Z`;
}

export function buildDateEnd(value: string) {
  return `${value}T23:59:59.000Z`;
}

export function combineDateAndTime(date: string, time: string) {
  return `${date}T${time}:00.000Z`;
}

export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocalizacao indisponivel neste dispositivo."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      (err) => {
        let msg = "Erro ao obter localizacao.";
        if (err.code === err.PERMISSION_DENIED) msg = "Permissao de localizacao negada pelo usuario.";
        else if (err.code === err.POSITION_UNAVAILABLE) msg = "Informacao de localizacao indisponivel.";
        else if (err.code === err.TIMEOUT) msg = "Tempo esgotado ao obter localizacao.";
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );

  });
}

export function timelineTitle(item: RhAjustePonto | RhFerias | RhAtestado, type: "ajuste" | "ferias" | "atestado") {
  if (type === "ajuste") {
    return (item as RhAjustePonto).justificativa;
  }
  if (type === "ferias") {
    const ferias = item as RhFerias;
    return `${formatDate(ferias.data_inicio)} ate ${formatDate(ferias.data_fim)}`;
  }
  const atestado = item as RhAtestado;
  return `${formatDate(atestado.data_inicio)} ate ${formatDate(atestado.data_fim)}`;
}

export function timelineSubtitle(item: RhAjustePonto | RhFerias | RhAtestado, type: "ajuste" | "ferias" | "atestado") {
  if (type === "ajuste") {
    return `Referencia ${formatDate((item as RhAjustePonto).data_referencia)}`;
  }
  if (type === "ferias") {
    return "Solicitacao de ferias";
  }
  return (item as RhAtestado).has_file ? "Documento anexado" : "Sem documento anexado";
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}
