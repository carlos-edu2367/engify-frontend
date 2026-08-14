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

/**
 * As tres funcoes abaixo traduzem o que o funcionario digita — uma data e uma
 * hora de parede, no fuso do dispositivo dele — para o instante UTC que o
 * backend persiste. Anexar "Z" direto na string, como era feito antes,
 * carimbava a hora local como UTC e fazia o painel do RH exibir tres horas a
 * menos e, na data de referencia, o dia anterior.
 */
/**
 * toISOString lanca RangeError em data invalida, e o payload do ajuste e
 * remontado a cada render — inclusive com o formulario ainda vazio. Devolver
 * string vazia mantem a tela de pe; o envio so acontece com o passo validado.
 */
function toInstant(local: string) {
  const data = new Date(local);
  return Number.isNaN(data.getTime()) ? "" : data.toISOString();
}

export function buildDateStart(value: string) {
  return toInstant(`${value}T00:00:00`);
}

export function buildDateEnd(value: string) {
  return toInstant(`${value}T23:59:59.999`);
}

export function combineDateAndTime(date: string, time: string) {
  return toInstant(`${date}T${time}:00`);
}

/** "seg., 10/08/2026 às 17:48" — data e hora sempre juntas, para nao restar ambiguidade. */
export function formatDataHora(iso: string) {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) {
    return iso;
  }
  const dia = new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(data);
  const hora = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(data);
  return `${dia} às ${hora}`;
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

/**
 * Intl lanca RangeError quando recebe uma data invalida. Como esses helpers
 * rodam durante o render da area do funcionario, um unico valor ausente ou
 * fora do padrao derrubava a rota inteira no errorElement. Formata quando da,
 * devolve um texto legivel quando nao da.
 */
function safeFormat(value: string | null | undefined, options: Intl.DateTimeFormatOptions) {
  if (!value) {
    return "Nao informado";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("pt-BR", options).format(date);
}

export function formatDateTime(value: string) {
  return safeFormat(value, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value: string) {
  return safeFormat(value, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
