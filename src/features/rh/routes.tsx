import { lazy, Suspense, type ReactNode } from "react";
import { RhTableSkeleton } from "./shared/components/RhTableSkeleton";

const RhDashboardPage = lazy(() =>
  import("./dashboard/pages/RhDashboardPage").then((module) => ({ default: module.RhDashboardPage }))
);
const FuncionariosPage = lazy(() =>
  import("./funcionarios/pages/FuncionariosPage").then((module) => ({ default: module.FuncionariosPage }))
);
const NovoFuncionarioPage = lazy(() =>
  import("./funcionarios/pages/NovoFuncionarioPage").then((module) => ({ default: module.NovoFuncionarioPage }))
);
const FuncionarioDetailPage = lazy(() =>
  import("./funcionarios/pages/FuncionarioDetailPage").then((module) => ({ default: module.FuncionarioDetailPage }))
);
const PontoPage = lazy(() =>
  import("./ponto/pages/PontoPage").then((module) => ({ default: module.PontoPage }))
);
const AjustesPontoPage = lazy(() =>
  import("./ponto/pages/AjustesPontoPage").then((module) => ({ default: module.AjustesPontoPage }))
);
const FeriasPage = lazy(() =>
  import("./ferias/pages/FeriasPage").then((module) => ({ default: module.FeriasPage }))
);
const AtestadosPage = lazy(() =>
  import("./atestados/pages/AtestadosPage").then((module) => ({ default: module.AtestadosPage }))
);
const FolhaPage = lazy(() =>
  import("./folha/pages/FolhaPage").then((module) => ({ default: module.FolhaPage }))
);
const HoleritesPage = lazy(() =>
  import("./holerites/pages/HoleritesPage").then((module) => ({ default: module.HoleritesPage }))
);
const HoleriteDetailPage = lazy(() =>
  import("./holerites/pages/HoleriteDetailPage").then((module) => ({ default: module.HoleriteDetailPage }))
);
const ConfiguracoesRhPage = lazy(() =>
  import("./configuracoes/pages/ConfiguracoesRhPage").then((module) => ({ default: module.ConfiguracoesRhPage }))
);
const RhAuditoriaPage = lazy(() =>
  import("./auditoria/pages/RhAuditoriaPage").then((module) => ({ default: module.RhAuditoriaPage }))
);
const RhLegacyOperationalPage = lazy(async () => {
  const { AdminRhView } = await import("@/components/features/rh/AdminRhView");

  return {
    default: function LegacyOperationalPage() {
      return (
        <div className="flex flex-col gap-6">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-200">
            Tela operacional legada mantida durante a refatoracao para preservar ponto, ferias, atestados, folha e auditoria.
          </div>
          <AdminRhView />
        </div>
      );
    },
  };
});

function LazyRhPage({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<RhTableSkeleton rows={4} />}>
      {children}
    </Suspense>
  );
}

export const rhAdminRoutes = {
  dashboard: (
    <LazyRhPage>
      <RhDashboardPage />
    </LazyRhPage>
  ),
  legacy: (
    <LazyRhPage>
      <RhLegacyOperationalPage />
    </LazyRhPage>
  ),
  funcionarios: (
    <LazyRhPage>
      <FuncionariosPage />
    </LazyRhPage>
  ),
  novoFuncionario: (
    <LazyRhPage>
      <NovoFuncionarioPage />
    </LazyRhPage>
  ),
  funcionarioDetail: (
    <LazyRhPage>
      <FuncionarioDetailPage />
    </LazyRhPage>
  ),
  ponto: (
    <LazyRhPage>
      <PontoPage />
    </LazyRhPage>
  ),
  pontoInconsistencias: (
    <LazyRhPage>
      <PontoPage forcedStatus="inconsistente" title="Inconsistencias de ponto" />
    </LazyRhPage>
  ),
  pontoAjustes: (
    <LazyRhPage>
      <AjustesPontoPage />
    </LazyRhPage>
  ),
  ferias: (
    <LazyRhPage>
      <FeriasPage />
    </LazyRhPage>
  ),
  atestados: (
    <LazyRhPage>
      <AtestadosPage />
    </LazyRhPage>
  ),
  folha: (
    <LazyRhPage>
      <FolhaPage />
    </LazyRhPage>
  ),
  folhaCompetencia: (
    <LazyRhPage>
      <FolhaPage />
    </LazyRhPage>
  ),
  folhaFechamento: (
    <LazyRhPage>
      <FolhaPage fechamento />
    </LazyRhPage>
  ),
  holerites: (
    <LazyRhPage>
      <HoleritesPage />
    </LazyRhPage>
  ),
  holeriteDetail: (
    <LazyRhPage>
      <HoleriteDetailPage />
    </LazyRhPage>
  ),
  configuracoes: (
    <LazyRhPage>
      <ConfiguracoesRhPage />
    </LazyRhPage>
  ),
  configuracoesBeneficios: (
    <LazyRhPage>
      <ConfiguracoesRhPage section="beneficios" />
    </LazyRhPage>
  ),
  configuracoesEncargos: (
    <LazyRhPage>
      <ConfiguracoesRhPage section="encargos" />
    </LazyRhPage>
  ),
  configuracoesRegras: (
    <LazyRhPage>
      <ConfiguracoesRhPage section="regras" />
    </LazyRhPage>
  ),
  configuracoesTabelasProgressivas: (
    <LazyRhPage>
      <ConfiguracoesRhPage section="tabelas-progressivas" />
    </LazyRhPage>
  ),
  auditoria: (
    <LazyRhPage>
      <RhAuditoriaPage />
    </LazyRhPage>
  ),
};
