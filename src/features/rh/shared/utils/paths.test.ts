import { describe, expect, it } from "vitest";
import { rhPaths } from "./paths";

describe("rhPaths", () => {
  it("keeps canonical RH paths without the app prefix used by the current router", () => {
    expect(rhPaths.dashboard).toBe("/rh");
    expect(rhPaths.funcionarioDetail("abc")).toBe("/rh/funcionarios/abc");
  });

  it("exposes app-prefixed aliases requested by the RH refactor plan", () => {
    expect(rhPaths.appAliases.dashboard).toBe("/app/rh");
    expect(rhPaths.appAliases.funcionarioDetail("abc")).toBe("/app/rh/funcionarios/abc");
  });

  it("exposes operational, payroll, settings, and audit routes from phases 4 to 7", () => {
    expect(rhPaths.ponto).toBe("/rh/ponto");
    expect(rhPaths.pontoInconsistencias).toBe("/rh/ponto/inconsistencias");
    expect(rhPaths.pontoAjustes).toBe("/rh/ponto/ajustes");
    expect(rhPaths.ferias).toBe("/rh/ferias");
    expect(rhPaths.atestados).toBe("/rh/atestados");
    expect(rhPaths.folha).toBe("/rh/folha");
    expect(rhPaths.folhaCompetencia(2026, 4)).toBe("/rh/folha/2026/4");
    expect(rhPaths.folhaFechamento(2026, 4)).toBe("/rh/folha/2026/4/fechamento");
    expect(rhPaths.holerites).toBe("/rh/holerites");
    expect(rhPaths.holeriteDetail("hol-1")).toBe("/rh/holerites/hol-1");
    expect(rhPaths.configuracoes).toBe("/rh/configuracoes");
    expect(rhPaths.configuracoesBeneficios).toBe("/rh/configuracoes/beneficios");
    expect(rhPaths.configuracoesEncargos).toBe("/rh/configuracoes/encargos");
    expect(rhPaths.configuracoesRegras).toBe("/rh/configuracoes/regras");
    expect(rhPaths.configuracoesTabelasProgressivas).toBe("/rh/configuracoes/tabelas-progressivas");
    expect(rhPaths.auditoria).toBe("/rh/auditoria");
  });
});
