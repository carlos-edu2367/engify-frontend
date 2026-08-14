import { describe, expect, it } from "vitest";
import type { RhAjustePonto, RhAtestado, RhFerias } from "@/types/rh.types";
import {
  buildDateEnd,
  buildDateStart,
  combineDateAndTime,
  formatDataHora,
  formatDateTime,
  timelineSubtitle,
  timelineTitle,
} from "./rh-utils";

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

  // toISOString lanca RangeError em data invalida. A aba de solicitacoes monta o
  // payload a cada render, ainda com o formulario vazio — sem essa guarda a tela
  // caia no errorElement assim que o funcionario abria a aba.
  it("nao lanca quando a data ainda nao foi preenchida", () => {
    expect(() => buildDateStart("")).not.toThrow();
    expect(() => buildDateEnd("")).not.toThrow();
    expect(() => combineDateAndTime("", "08:00")).not.toThrow();
  });

  it("nao lanca quando a data nao pode ser lida", () => {
    expect(() => buildDateStart("31/02/2026")).not.toThrow();
    expect(() => combineDateAndTime("2026-08-10", "99:99")).not.toThrow();
  });
});

describe("formatDateTime", () => {
  it("formata um instante ISO valido", () => {
    expect(formatDateTime("2026-08-13T14:30:00Z")).toContain("13/08/2026");
  });

  // A tela do funcionario inteira caia quando o Intl recebia uma data invalida:
  // o RangeError subia ate o errorElement da rota e apagava a area de RH.
  it("nao lanca quando o valor esta ausente", () => {
    expect(() => formatDateTime(undefined as unknown as string)).not.toThrow();
  });

  it("nao lanca quando o valor nao pode ser lido", () => {
    expect(() => formatDateTime("sem data")).not.toThrow();
  });

  it("mantem o valor original quando nao consegue formatar", () => {
    expect(formatDateTime("sem data")).toBe("sem data");
  });
});

describe("timeline helpers", () => {
  it("nao lanca quando um periodo de ferias nao tem datas", () => {
    const ferias = { id: "1", status: "solicitado" } as unknown as RhFerias;
    expect(() => timelineTitle(ferias, "ferias")).not.toThrow();
  });

  it("nao lanca quando um atestado nao tem datas", () => {
    const atestado = { id: "1", status: "entregue" } as unknown as RhAtestado;
    expect(() => timelineTitle(atestado, "atestado")).not.toThrow();
  });

  it("nao lanca quando um ajuste nao tem data de referencia", () => {
    const ajuste = { id: "1", justificativa: "x", status: "pendente" } as unknown as RhAjustePonto;
    expect(() => timelineSubtitle(ajuste, "ajuste")).not.toThrow();
  });
});
