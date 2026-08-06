import { describe, expect, it } from "vitest";
import { getEstadoMargem } from "./margem";

describe("getEstadoMargem", () => {
  it("saudavel quando pct acima do limiar", () => {
    expect(getEstadoMargem("100000.00", "66.67")).toBe("saudavel");
  });

  it("saudavel no limiar inclusivo de 10%", () => {
    expect(getEstadoMargem("1000.00", "10")).toBe("saudavel");
  });

  it("apertada logo abaixo de 10%", () => {
    expect(getEstadoMargem("999.00", "9.99")).toBe("apertada");
  });

  it("apertada em 0%", () => {
    expect(getEstadoMargem("0.00", "0")).toBe("apertada");
  });

  it("prejuizo quando margem negativa, independente do pct", () => {
    expect(getEstadoMargem("-500.00", "-50")).toBe("prejuizo");
  });

  it("indefinida quando margem e null", () => {
    expect(getEstadoMargem(null, null)).toBe("indefinida");
  });

  it("indefinida quando pct e null e margem nao e negativa (contrato zero, sem custo)", () => {
    expect(getEstadoMargem("0.00", null)).toBe("indefinida");
  });

  it("prejuizo tem prioridade sobre pct null quando margem e negativa", () => {
    // contrato=0 com custo incorrido: margem negativa e pct sempre null (divisao por zero).
    // Uma obra sangrando dinheiro deve alertar mesmo sem contrato definido.
    expect(getEstadoMargem("-500.00", null)).toBe("prejuizo");
  });
});
