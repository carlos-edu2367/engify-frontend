import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PermissionGate } from "../../shared/components/PermissionGate";
import { RhPageHeader } from "../../shared/components/RhPageHeader";
import { rhPaths } from "../../shared/utils/paths";
import { FuncionarioWizard } from "../components/FuncionarioWizard";

export function NovoFuncionarioPage() {
  return (
    <PermissionGate permission="rh.funcionarios.create" showDeniedState>
      <div className="flex flex-col gap-6">
        <RhPageHeader
          title="Novo funcionario"
          description="Cadastro em etapas para evitar formularios longos e reduzir erro operacional."
          actions={
            <Button variant="outline" asChild>
              <Link to={rhPaths.funcionarios}>Voltar para lista</Link>
            </Button>
          }
        />
        <FuncionarioWizard />
      </div>
    </PermissionGate>
  );
}
