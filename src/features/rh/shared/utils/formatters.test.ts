import { describe, expect, it } from "vitest";
import {
  formatCompetence,
  formatRhDate,
  maskCpf,
  statusBadgeVariant,
  statusLabel,
  summarizeSchedule,
} from "./formatters";

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
});
