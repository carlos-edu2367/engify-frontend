import { describe, expect, it } from "vitest";
import {
  employeeDisplay,
  humanizeAuditValue,
  isTechnicalIdentifier,
  safeTipoAtestadoName,
} from "./display";

describe("rh display helpers", () => {
  it("shows employee by name, role and masked cpf without technical ids", () => {
    expect(
      employeeDisplay({
        id: "8d431ae5-d7be-49aa-b94b-8017d8380f04",
        funcionario_nome: "Carla Souza",
        funcionario_cargo: "Analista",
        funcionario_cpf_mascarado: "***.123.456-**",
      })
    ).toEqual({
      title: "Carla Souza",
      subtitle: "Analista · ***.123.456-**",
    });
  });

  it("uses a human fallback when removed certificate type has no name", () => {
    expect(safeTipoAtestadoName({ tipo_atestado_nome: null })).toBe("Tipo removido");
  });

  it("redacts technical audit values", () => {
    expect(humanizeAuditValue("request_id", "req-123")).toBe("Restrito");
    expect(humanizeAuditValue("cpf", "12345678901")).toBe("***.456.789-**");
    expect(humanizeAuditValue("salario_base", "4500.00")).toBe("Valor sensivel");
  });

  it("detects uuids as technical identifiers", () => {
    expect(isTechnicalIdentifier("7cb9c4b2-43a0-4ed7-8842-f3450cc03b87")).toBe(true);
    expect(isTechnicalIdentifier("Carla Souza")).toBe(false);
  });
});
