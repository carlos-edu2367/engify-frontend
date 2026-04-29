import { Link } from "react-router-dom";
import { Settings2, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PermissionGate } from "../../shared/components/PermissionGate";
import { RhPageHeader } from "../../shared/components/RhPageHeader";
import { rhPaths } from "../../shared/utils/paths";
import { TiposAtestadoSection } from "./TiposAtestadoSection";

type ConfigSection = "overview" | "beneficios" | "encargos" | "regras" | "tabelas-progressivas";

const sections: Array<{ key: ConfigSection; title: string; path: string; description: string }> = [
  { key: "beneficios", title: "Beneficios", path: rhPaths.configuracoesBeneficios, description: "Beneficios administrativos e aplicabilidade quando disponivel." },
  { key: "encargos", title: "Encargos", path: rhPaths.configuracoesEncargos, description: "Regras de encargos, status e vigencias." },
  { key: "regras", title: "Regras", path: rhPaths.configuracoesRegras, description: "CRUD e versionamento de regras expostos pelo backend." },
  { key: "tabelas-progressivas", title: "Tabelas progressivas", path: rhPaths.configuracoesTabelasProgressivas, description: "Faixas progressivas usadas por regras de calculo." },
];

export function ConfiguracoesRhPage({ section = "overview" }: { section?: ConfigSection }) {
  const current = sections.find((item) => item.key === section);

  return (
    <PermissionGate permission="rh.regras.view" showDeniedState>
      <div className="flex flex-col gap-6">
        <RhPageHeader title={current?.title ?? "Configuracoes de RH"} description="Configuracoes criticas separadas da operacao diaria." />
        <div className="flex flex-wrap gap-2">
          <Button variant={section === "overview" ? "default" : "outline"} asChild><Link to={rhPaths.configuracoes}>Visao geral</Link></Button>
          {sections.map((item) => (
            <Button key={item.key} variant={section === item.key ? "default" : "outline"} asChild>
              <Link to={item.path}>{item.title}</Link>
            </Button>
          ))}
        </div>

        {section === "overview" ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {sections.map((item) => (
              <Card key={item.key}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Settings2 className="size-5" />
                    {item.title}
                  </CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm" asChild><Link to={item.path}>Abrir</Link></Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Table2 className="size-5" />
                {current?.title}
              </CardTitle>
              <CardDescription>{current?.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Abra a secao pela navegacao acima para consultar os contratos administrativos disponiveis.
              </p>
            </CardContent>
          </Card>
        )}

        <TiposAtestadoSection />
      </div>
    </PermissionGate>
  );
}
