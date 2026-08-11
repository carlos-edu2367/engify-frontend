import { buildDateStart, combineDateAndTime } from "../rh-utils";

export type RequestAjustesWizardValues = {
  dataReferencia?: string;
  justificativa?: string;
  entrada?: string;
  saida?: string;
  intervaloInicio?: string;
  intervaloFim?: string;
};

export type ScheduleField = "entrada" | "saida" | "intervaloInicio" | "intervaloFim";

export type AjusteHorarioOption = {
  label: string;
  fields: readonly ScheduleField[];
};

export const AJUSTE_HORARIO_OPTIONS = [
  { label: "Entrada", fields: ["entrada"] },
  { label: "Saída para intervalo", fields: ["intervaloInicio", "intervaloFim"] },
  { label: "Volta do intervalo", fields: ["intervaloInicio", "intervaloFim"] },
  { label: "Saída", fields: ["saida"] },
] as const satisfies readonly AjusteHorarioOption[];

const scheduleFields: readonly ScheduleField[] = ["entrada", "saida", "intervaloInicio", "intervaloFim"];

function hasText(value: string | undefined): boolean {
  return !!value?.trim();
}

function hasPartialInterval(values: RequestAjustesWizardValues): boolean {
  return hasText(values.intervaloInicio) !== hasText(values.intervaloFim);
}

function hasAnyScheduleField(values: RequestAjustesWizardValues): boolean {
  return scheduleFields.some((field) => hasText(values[field]));
}

export function getSelectedScheduleFields(values: RequestAjustesWizardValues): ScheduleField[] {
  const selected: ScheduleField[] = [];

  if (hasText(values.entrada)) {
    selected.push("entrada");
  }

  if (hasText(values.intervaloInicio) || hasText(values.intervaloFim)) {
    selected.push("intervaloInicio", "intervaloFim");
  }

  if (hasText(values.saida)) {
    selected.push("saida");
  }

  return selected;
}

export function hasSelectedSchedule(values: RequestAjustesWizardValues): boolean {
  return hasAnyScheduleField(values);
}

export function isWizardStepValid(step: 1 | 2 | 3, values: RequestAjustesWizardValues): boolean {
  if (step === 1) {
    return hasText(values.dataReferencia);
  }

  if (step === 2) {
    return hasAnyScheduleField(values) && !hasPartialInterval(values);
  }

  return hasText(values.justificativa);
}

export function getWizardError(step: 1 | 2 | 3, values: RequestAjustesWizardValues): string | null {
  if (step === 1 && !hasText(values.dataReferencia)) {
    return "Escolha o dia do problema para continuar.";
  }

  if (step === 2) {
    if (hasPartialInterval(values)) {
      return "Preencha início e fim do intervalo.";
    }

    if (!hasAnyScheduleField(values)) {
      return "Selecione ao menos um horário para continuar.";
    }
  }

  if (step === 3 && !hasText(values.justificativa)) {
    return "Informe a justificativa para continuar.";
  }

  return null;
}

export type AjustePayload = {
  data_referencia: string;
  justificativa: string;
  hora_entrada_solicitada: string | null;
  hora_saida_solicitada: string | null;
  hora_intervalo_inicio_solicitada: string | null;
  hora_intervalo_fim_solicitada: string | null;
};

/**
 * Fonte unica do que sera enviado ao backend. A revisao e o dialogo de
 * confirmacao leem daqui, e nao dos campos crus do formulario: era exatamente
 * essa diferenca que fazia a tela mostrar 17:48 enquanto o payload dizia
 * outra coisa.
 */
export function buildAjustePayload(values: RequestAjustesWizardValues): AjustePayload {
  const data = values.dataReferencia ?? "";
  const hora = (value: string | undefined) =>
    hasText(value) ? combineDateAndTime(data, (value as string).trim()) : null;

  return {
    data_referencia: buildDateStart(data),
    justificativa: (values.justificativa ?? "").trim(),
    hora_entrada_solicitada: hora(values.entrada),
    hora_saida_solicitada: hora(values.saida),
    hora_intervalo_inicio_solicitada: hora(values.intervaloInicio),
    hora_intervalo_fim_solicitada: hora(values.intervaloFim),
  };
}
