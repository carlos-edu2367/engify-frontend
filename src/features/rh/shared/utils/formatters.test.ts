import { describe, expect, it } from "vitest";
import {
  formatCompetence,
  formatRhDate,
  maskCpf,
  statusBadgeVariant,
  statusLabel,
  summarizeSchedule,
} from "./formatters";
import {
  buildDefaultSchedule,
  buildScheduleFromTurnos,
  extractTurnos,
} from "@/components/features/rh/rh-utils";

describe("rh formatters", () => {
  it("formats competence with two-digit month", () => {
    expect(formatCompetence(4, 2026)).toBe("04/2026");
  });

  it("masks cpf values by default", () => {
    expect(maskCpf("12345678901")).toBe("***.456.789-**");
  });

  it("labels known statuses and keeps unknown statuses readable", () => {
    expect(statusLabel("pendente")).toBe("Pendente");
    expect(statusLabel("custom_status")).toBe("custom status");
  });

  it("maps risky statuses to destructive badges", () => {
    expect(statusBadgeVariant("vencido")).toBe("destructive");
  });

  it("summarizes enabled schedule days", () => {
    expect(
      summarizeSchedule([
        { dia_semana: 0, hora_entrada: "08:00:00", hora_saida: "17:00:00" },
        { dia_semana: 1, hora_entrada: "08:00:00", hora_saida: "17:00:00" },
      ])
    ).toBe("2 dias/semana");
  });

  it("keeps invalid dates visible instead of throwing", () => {
    expect(formatRhDate("sem-data")).toBe("sem-data");
  });

  it("builds the default weekday schedule from 08:00 to 18:00 with lunch break", () => {
    const schedule = buildDefaultSchedule();

    expect(schedule.map((row) => row.label)).toEqual([
      "Segunda",
      "Terca",
      "Quarta",
      "Quinta",
      "Sexta",
      "Sabado",
      "Domingo",
    ]);
    expect(schedule.slice(0, 5)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          enabled: true,
          hora_entrada: "08:00",
          hora_saida: "18:00",
          intervalo_inicio: "12:00",
          intervalo_fim: "14:00",
        }),
      ])
    );
    expect(schedule.slice(5)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ enabled: false }),
      ])
    );
  });

  it("extracts default schedule intervals using the API contract shape", () => {
    expect(extractTurnos(buildDefaultSchedule())).toEqual([
      {
        dia_semana: 0,
        hora_entrada: "08:00:00",
        hora_saida: "18:00:00",
        intervalos: [{ hora_inicio: "12:00:00", hora_fim: "14:00:00" }],
      },
      {
        dia_semana: 1,
        hora_entrada: "08:00:00",
        hora_saida: "18:00:00",
        intervalos: [{ hora_inicio: "12:00:00", hora_fim: "14:00:00" }],
      },
      {
        dia_semana: 2,
        hora_entrada: "08:00:00",
        hora_saida: "18:00:00",
        intervalos: [{ hora_inicio: "12:00:00", hora_fim: "14:00:00" }],
      },
      {
        dia_semana: 3,
        hora_entrada: "08:00:00",
        hora_saida: "18:00:00",
        intervalos: [{ hora_inicio: "12:00:00", hora_fim: "14:00:00" }],
      },
      {
        dia_semana: 4,
        hora_entrada: "08:00:00",
        hora_saida: "18:00:00",
        intervalos: [{ hora_inicio: "12:00:00", hora_fim: "14:00:00" }],
      },
    ]);
  });

  it("uses the same business-hours fallback when there are no saved shifts", () => {
    expect(buildScheduleFromTurnos(undefined).slice(0, 1)).toEqual([
      expect.objectContaining({
        enabled: true,
        hora_entrada: "08:00",
        hora_saida: "18:00",
        intervalo_inicio: "12:00",
        intervalo_fim: "14:00",
      }),
    ]);
  });
});
