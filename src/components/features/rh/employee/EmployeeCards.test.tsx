import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EmployeeTodayCard } from "./EmployeeTodayCard";
import { EmployeePointStateSection, resolveSituacaoBadge } from "./EmployeePointStateSection";
import type { RhEstadoPonto7Dias, RhPontoHoje } from "@/types/rh.types";

// Cada caso abaixo derrubava a rota /meu-rh inteira: o throw acontecia no
// render e subia ate o errorElement, que troca o AppShell pela tela de erro.

function estado(partial: Partial<RhEstadoPonto7Dias>): RhEstadoPonto7Dias {
  return {
    inicio: "2026-08-07",
    fim: "2026-08-13",
    faltas: 0,
    horas_extras: "0.00",
    horas_faltantes: "0.00",
    pontos_inconsistentes: 0,
    dias: [],
    ...partial,
  } as RhEstadoPonto7Dias;
}

describe("EmployeeTodayCard", () => {
  it("renders when the API omits batidas", () => {
    const hoje = { data: "2026-08-14", tem_expediente: true, jornada_aberta: false } as unknown as RhPontoHoje;
    expect(() => renderToStaticMarkup(<EmployeeTodayCard hoje={hoje} />)).not.toThrow();
  });

  it("renders when a batida has no timestamp", () => {
    const hoje = {
      data: "2026-08-14",
      tem_expediente: true,
      jornada_aberta: true,
      batidas: [{ tipo: "entrada", status: "validado" }],
    } as unknown as RhPontoHoje;
    expect(() => renderToStaticMarkup(<EmployeeTodayCard hoje={hoje} />)).not.toThrow();
  });
});

describe("EmployeePointStateSection", () => {
  it("renders when a day has no date", () => {
    const state = estado({
      dias: [
        {
          situacao: "falta",
          minutos_esperados: 480,
          minutos_trabalhados: 0,
          minutos_extras: 0,
          minutos_faltantes: 480,
        },
      ] as never,
    });
    expect(() => renderToStaticMarkup(<EmployeePointStateSection state={state} />)).not.toThrow();
  });

  it("renders when the period boundaries are missing", () => {
    const state = estado({ inicio: undefined, fim: undefined } as never);
    expect(() => renderToStaticMarkup(<EmployeePointStateSection state={state} />)).not.toThrow();
  });

  // Um dia com situacao desconhecida so aparece depois de "Ver todos os 7 dias",
  // entao o render inicial nao cobre esse caminho — o helper cobre.
  it("resolves a badge for a situacao the frontend does not know yet", () => {
    expect(() => resolveSituacaoBadge("compensado" as never)).not.toThrow();
    expect(resolveSituacaoBadge("compensado" as never).label).toBeTruthy();
  });
});
