import { describe, expect, it } from "vitest";
import { buildDateEnd, buildDateStart, combineDateAndTime, formatDataHora } from "./rh-utils";

describe("rh-utils datas e horas", () => {
  it("envia a hora de parede local como instante UTC correto", () => {
    // O caso da reclamacao: saida as 17:48 do dia 10 em UTC-3 e 20:48Z.
    expect(combineDateAndTime("2026-08-10", "17:48")).toBe("2026-08-10T20:48:00.000Z");
  });

  it("nao carimba hora local como UTC", () => {
    expect(combineDateAndTime("2026-08-10", "17:48")).not.toBe("2026-08-10T17:48:00.000Z");
  });

  it("usa o inicio do dia local como referencia", () => {
    expect(buildDateStart("2026-08-10")).toBe("2026-08-10T03:00:00.000Z");
  });

  it("usa o fim do dia local como referencia", () => {
    expect(buildDateEnd("2026-08-10")).toBe("2026-08-11T02:59:59.999Z");
  });

  it("formata data e hora juntas para a revisao", () => {
    expect(formatDataHora("2026-08-10T20:48:00.000Z")).toContain("10/08/2026");
    expect(formatDataHora("2026-08-10T20:48:00.000Z")).toContain("17:48");
  });
});
