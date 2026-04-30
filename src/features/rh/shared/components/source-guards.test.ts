import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "../../../../../");

function read(relativePath: string) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

function listTsxFiles(relativePath: string): string[] {
  const absolutePath = resolve(root, relativePath);
  return readdirSync(absolutePath).flatMap((entry) => {
    const entryRelativePath = `${relativePath}/${entry}`;
    const entryAbsolutePath = resolve(root, entryRelativePath);

    if (statSync(entryAbsolutePath).isDirectory()) {
      return listTsxFiles(entryRelativePath);
    }

    return entry.endsWith(".tsx") ? [entryRelativePath] : [];
  });
}

describe("rh frontend source guards", () => {
  it("common rh screens avoid technical implementation language", () => {
    const files = [
      ...listTsxFiles("src/features/rh"),
      ...listTsxFiles("src/components/features/rh"),
    ];

    for (const file of files) {
      expect(read(file)).not.toMatch(/\b(backend|endpoint|Fase|rota dedicada|legado)\b/i);
    }
  });

  it("employee detail keeps linked user ids out of visible content", () => {
    const source = read("src/features/rh/funcionarios/pages/FuncionarioDetailPage.tsx");

    expect(source).not.toMatch(/Usuario vinculado", funcionario\.user_id/);
    expect(source).not.toMatch(/funcionario\.user_id \?\? "Sem vinculo"/);
    expect(source).toMatch(/UsuarioVinculadoCard/);
  });

  it("time tracking detail uses safe map preview without exposing raw coordinates", () => {
    const source = read("src/features/rh/ponto/pages/PontoPage.tsx");
    const mapSource = read("src/features/rh/shared/components/RhMapPreview.tsx");

    expect(source).toMatch(/RhMapPreview/);
    expect(source).toMatch(/locais_autorizados/);
    expect(source).not.toMatch(/Latitude|Longitude|Coordenadas/i);
    expect(mapSource).toMatch(/Circle/);
    expect(mapSource).toMatch(/Marker/);
  });

  it("employee detail exposes permitted point locations and operational summaries", () => {
    const source = read("src/features/rh/funcionarios/pages/FuncionarioDetailPage.tsx");
    const locationsSource = read("src/features/rh/funcionarios/components/LocaisPontoTab.tsx");

    expect(source).toMatch(/LocaisPontoTab/);
    expect(source).toMatch(/FuncionarioOperationalSummary/);
    expect(locationsSource).toMatch(/rh\.ponto\.view/);
    expect(locationsSource).toMatch(/rh\.ponto\.manage_locations/);
  });

  it("administrative setup pages expose creation dialogs with permitted actions", () => {
    const benefits = read("src/features/rh/beneficios/pages/BeneficiosPage.tsx");
    const rules = read("src/features/rh/encargos/pages/RegrasEncargosPage.tsx");
    const tables = read("src/features/rh/tabelas-progressivas/pages/TabelasProgressivasPage.tsx");
    const tableDialog = read("src/features/rh/tabelas-progressivas/components/TabelaProgressivaDialog.tsx");

    expect(benefits).toMatch(/BeneficioDialog/);
    expect(benefits).toMatch(/Novo beneficio/);
    expect(rules).toMatch(/RegraEncargoDialog/);
    expect(rules).toMatch(/Nova regra/);
    expect(rules).toMatch(/Como criar\?/);
    expect(tables).toMatch(/TabelaProgressivaDialog/);
    expect(tables).toMatch(/Nova tabela/);
    expect(tables).toMatch(/Como criar\?/);
    expect(tableDialog).toMatch(/FaixasProgressivasEditor/);
  });

  it("charge rule creation uses backend enum values and exposes field guidance", () => {
    const page = read("src/features/rh/encargos/pages/RegrasEncargosPage.tsx");
    const dialog = read("src/features/rh/encargos/components/RegraEncargoDialog.tsx");
    const tutorial = read("src/features/rh/encargos/components/RegraEncargoTutorialDialog.tsx");

    expect(page).toMatch(/RegraEncargoTutorialDialog/);
    expect(dialog).toMatch(/value="percentual_simples"/);
    expect(dialog).toMatch(/value="tabela_progressiva"/);
    expect(tutorial).toMatch(/Tipo percentual simples/);
    expect(tutorial).toMatch(/Base de calculo/);
    expect(tutorial).toMatch(/Aplicabilidade/);
  });

  it("progressive table creation explains usage and persists ranges after creating the draft", () => {
    const page = read("src/features/rh/tabelas-progressivas/pages/TabelasProgressivasPage.tsx");
    const tutorial = read("src/features/rh/tabelas-progressivas/components/TabelaProgressivaTutorialDialog.tsx");
    const dialog = read("src/features/rh/tabelas-progressivas/components/TabelaProgressivaDialog.tsx");

    expect(page).toMatch(/TabelaProgressivaTutorialDialog/);
    expect(page).toMatch(/createTabelaProgressiva/);
    expect(page).toMatch(/updateTabelaProgressivaFaixas/);
    expect(tutorial).toMatch(/calculo marginal/i);
    expect(tutorial).toMatch(/aliquota/i);
    expect(tutorial).toMatch(/deducao/i);
    expect(dialog).toMatch(/valor_inicial/);
    expect(dialog).toMatch(/valor_final/);
  });

  it("employee wizard does not ask for a user uuid manually", () => {
    const source = read("src/features/rh/funcionarios/components/FuncionarioWizard.tsx");

    expect(source).not.toMatch(/UUID do usuario|Use o ID do usuario/i);
    expect(source).toMatch(/UserSearchSelect/);
  });

  it("operational pages do not show employee id filters", () => {
    const files = [
      "src/features/rh/folha/pages/FolhaPage.tsx",
      "src/features/rh/ponto/pages/PontoPage.tsx",
      "src/features/rh/ponto/pages/AjustesPontoPage.tsx",
      "src/features/rh/ferias/pages/FeriasPage.tsx",
      "src/features/rh/atestados/pages/AtestadosPage.tsx",
    ];

    for (const file of files) {
      const source = read(file);
      expect(source).not.toMatch(/ID do funcionario/i);
      expect(source).toMatch(/EmployeeSearchSelect/);
    }
  });

  it("atestados page uses signed upload flow instead of file_path input", () => {
    const source = read("src/features/rh/atestados/pages/AtestadosPage.tsx");

    expect(source).not.toMatch(/file_path|storage\/path|caminho seguro/i);
    const hookSource = read("src/features/rh/atestados/hooks/useAtestadosOperacionais.ts");
    expect(hookSource).toMatch(/requestAtestadoUploadUrl/);
    expect(hookSource).toMatch(/confirmAtestadoUpload/);
  });

  it("audit table avoids raw actor/entity ids in common UI", () => {
    const source = read("src/features/rh/auditoria/pages/RhAuditoriaPage.tsx");

    expect(source).not.toMatch(/actor_user_id|entity_id|ip_hash|request_id|user_agent/);
    expect(source).toMatch(/actor_nome/);
    expect(source).toMatch(/entity_label/);
  });
});
