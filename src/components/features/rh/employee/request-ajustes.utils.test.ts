import { describe, expect, it } from "vitest";
import {
  AJUSTE_HORARIO_OPTIONS,
  buildAjustePayload,
  getSelectedScheduleFields,
  getWizardError,
  hasSelectedSchedule,
  isWizardStepValid,
} from "./request-ajustes.utils";

describe("request-ajustes wizard utilities", () => {
  it("permite enviar somente a saída", () => {
    expect(hasSelectedSchedule({ saida: "17:00" })).toBe(true);
    expect(getSelectedScheduleFields({ saida: "17:00" })).toEqual(["saida"]);
  });

  it("exige início e fim quando o intervalo é escolhido", () => {
    expect(isWizardStepValid(2, { intervaloInicio: "12:00" })).toBe(false);
    expect(isWizardStepValid(2, { intervaloInicio: "12:00", intervaloFim: "13:00" })).toBe(true);
  });

  it("exige data e justificativa nas etapas correspondentes", () => {
    expect(isWizardStepValid(1, { dataReferencia: "" })).toBe(false);
    expect(isWizardStepValid(3, { justificativa: "   " })).toBe(false);
  });

  it("expõe os dois campos do intervalo quando apenas o início é preenchido", () => {
    expect(getSelectedScheduleFields({ intervaloInicio: "12:00" })).toEqual(["intervaloInicio", "intervaloFim"]);
  });

  it("considera um agendamento totalmente vazio como inválido", () => {
    expect(hasSelectedSchedule({})).toBe(false);
    expect(isWizardStepValid(2, {})).toBe(false);
  });

  it("fornece mensagens curtas em português para os passos inválidos", () => {
    expect(getWizardError(1, { dataReferencia: "" })).toBe("Escolha o dia do problema para continuar.");
    expect(getWizardError(2, {})).toBe("Selecione ao menos um horário para continuar.");
    expect(getWizardError(2, { intervaloInicio: "12:00" })).toBe("Preencha início e fim do intervalo.");
    expect(getWizardError(3, { justificativa: "   " })).toBe("Informe a justificativa para continuar.");
  });

  it("expõe as opções de horário com os rótulos exigidos", () => {
    expect(AJUSTE_HORARIO_OPTIONS.map((option) => option.label)).toEqual([
      "Entrada",
      "Saída para intervalo",
      "Volta do intervalo",
      "Saída",
    ]);
  });
});

describe("buildAjustePayload", () => {
  it("monta o payload com instantes UTC derivados da hora local", () => {
    const payload = buildAjustePayload({
      dataReferencia: "2026-08-10",
      justificativa: "Esqueci de registrar a saida.",
      saida: "17:48",
    });

    expect(payload.data_referencia).toBe("2026-08-10T03:00:00.000Z");
    expect(payload.hora_saida_solicitada).toBe("2026-08-10T20:48:00.000Z");
    expect(payload.hora_entrada_solicitada).toBeNull();
    expect(payload.hora_intervalo_inicio_solicitada).toBeNull();
    expect(payload.hora_intervalo_fim_solicitada).toBeNull();
  });

  it("preenche o par do intervalo quando informado", () => {
    const payload = buildAjustePayload({
      dataReferencia: "2026-08-10",
      justificativa: "Intervalo errado.",
      intervaloInicio: "12:00",
      intervaloFim: "13:00",
    });

    expect(payload.hora_intervalo_inicio_solicitada).toBe("2026-08-10T15:00:00.000Z");
    expect(payload.hora_intervalo_fim_solicitada).toBe("2026-08-10T16:00:00.000Z");
  });
});
