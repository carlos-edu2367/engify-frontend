import { describe, expect, it } from "vitest";
import { buildParcelasPreview } from "./parcelamento";

describe("buildParcelasPreview", () => {
  it("distribui o residuo de centavos na ultima parcela", () => {
    const p = buildParcelasPreview("1000.00", 3, "2026-01-10");
    expect(p.map((x) => x.valor)).toEqual(["333.33", "333.33", "333.34"]);
  });

  it("soma das parcelas bate com o total", () => {
    for (const total of ["1000.00", "0.03", "99.99", "1234.57"]) {
      for (const n of [2, 3, 7, 36]) {
        const soma = buildParcelasPreview(total, n, "2026-01-10").reduce(
          (acc, x) => acc + Math.round(Number(x.valor) * 100),
          0,
        );
        expect(soma).toBe(Math.round(Number(total) * 100));
      }
    }
  });

  it("gera vencimentos mensais", () => {
    const p = buildParcelasPreview("300.00", 3, "2026-01-10");
    expect(p.map((x) => x.data)).toEqual(["2026-01-10", "2026-02-10", "2026-03-10"]);
  });

  it("faz clamp no fim do mes", () => {
    const p = buildParcelasPreview("400.00", 4, "2026-01-31");
    expect(p.map((x) => x.data)).toEqual([
      "2026-01-31", "2026-02-28", "2026-03-31", "2026-04-30",
    ]);
  });

  it("numera as parcelas a partir de 1", () => {
    const p = buildParcelasPreview("200.00", 2, "2026-05-01");
    expect(p.map((x) => x.numero)).toEqual([1, 2]);
  });

  it("retorna vazio fora do limite de parcelas", () => {
    expect(buildParcelasPreview("100.00", 1, "2026-01-10")).toEqual([]);
    expect(buildParcelasPreview("100.00", 37, "2026-01-10")).toEqual([]);
  });
});
