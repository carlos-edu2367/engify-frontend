import { describe, expect, it } from "vitest";
import type { RhRegistroPonto } from "@/types/rh.types";
import { classifyDayPunches, punchRoleLabel } from "./punchClassification";

function punch(id: string, tipo: "entrada" | "saida", iso: string): RhRegistroPonto {
  return {
    id,
    funcionario_id: "f1",
    tipo,
    timestamp: iso,
    status: "validado",
  } as RhRegistroPonto;
}

describe("classifyDayPunches", () => {
  it("classifies a 4-punch day with one interval", () => {
    const roles = classifyDayPunches([
      punch("a", "entrada", "2026-06-23T08:00:00"),
      punch("b", "saida", "2026-06-23T12:00:00"),
      punch("c", "entrada", "2026-06-23T13:00:00"),
      punch("d", "saida", "2026-06-23T18:00:00"),
    ]);
    expect(roles.get("a")).toBe("jornada-entrada");
    expect(roles.get("b")).toBe("intervalo-inicio");
    expect(roles.get("c")).toBe("intervalo-fim");
    expect(roles.get("d")).toBe("jornada-saida");
  });

  it("classifies a plain 2-punch day without interval", () => {
    const roles = classifyDayPunches([
      punch("a", "entrada", "2026-06-23T08:00:00"),
      punch("b", "saida", "2026-06-23T17:00:00"),
    ]);
    expect(roles.get("a")).toBe("jornada-entrada");
    expect(roles.get("b")).toBe("jornada-saida");
  });

  it("marks an odd-count day as neutral (no false interval)", () => {
    const roles = classifyDayPunches([
      punch("a", "entrada", "2026-06-23T08:00:00"),
      punch("b", "saida", "2026-06-23T12:00:00"),
      punch("c", "entrada", "2026-06-23T13:00:00"),
    ]);
    expect(roles.get("a")).toBe("neutro");
    expect(roles.get("b")).toBe("neutro");
    expect(roles.get("c")).toBe("neutro");
  });

  it("handles two intervals in a day", () => {
    const roles = classifyDayPunches([
      punch("a", "entrada", "2026-06-23T08:00:00"),
      punch("b", "saida", "2026-06-23T10:00:00"),
      punch("c", "entrada", "2026-06-23T10:15:00"),
      punch("d", "saida", "2026-06-23T12:00:00"),
      punch("e", "entrada", "2026-06-23T13:00:00"),
      punch("f", "saida", "2026-06-23T18:00:00"),
    ]);
    expect(roles.get("b")).toBe("intervalo-inicio");
    expect(roles.get("c")).toBe("intervalo-fim");
    expect(roles.get("d")).toBe("intervalo-inicio");
    expect(roles.get("e")).toBe("intervalo-fim");
  });

  it("separates punches by local day and ignores order of input", () => {
    const roles = classifyDayPunches([
      punch("d2-saida", "saida", "2026-06-24T17:00:00"),
      punch("d1-entrada", "entrada", "2026-06-23T08:00:00"),
      punch("d2-entrada", "entrada", "2026-06-24T08:00:00"),
      punch("d1-saida", "saida", "2026-06-23T17:00:00"),
    ]);
    expect(roles.get("d1-entrada")).toBe("jornada-entrada");
    expect(roles.get("d1-saida")).toBe("jornada-saida");
    expect(roles.get("d2-entrada")).toBe("jornada-entrada");
    expect(roles.get("d2-saida")).toBe("jornada-saida");
  });

  it("exposes pt-BR labels for interval roles", () => {
    expect(punchRoleLabel["intervalo-inicio"]).toBe("Saida p/ intervalo");
    expect(punchRoleLabel["intervalo-fim"]).toBe("Volta do intervalo");
  });
});
