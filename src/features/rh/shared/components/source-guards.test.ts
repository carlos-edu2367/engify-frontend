import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "../../../../../");

function read(relativePath: string) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

describe("rh frontend source guards", () => {
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
