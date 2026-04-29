import { createBrowserRouter } from "react-router-dom";
import { PublicOnlyRoute } from "./PublicOnlyRoute";
import { ProtectedRoute } from "./ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";

// Public pages
import { LandingPage } from "@/pages/public/LandingPage";
import { LoginPage } from "@/pages/public/LoginPage";
import { RegisterTeamPage } from "@/pages/public/RegisterTeamPage";
import { RegisterAdminPage } from "@/pages/public/RegisterAdminPage";
import { RegisterInvitePage } from "@/pages/public/RegisterInvitePage";
import { RecoveryPage } from "@/pages/public/RecoveryPage";

// App pages
import { DashboardPage } from "@/pages/app/DashboardPage";
import { ObrasPage } from "@/pages/app/ObrasPage";
import { ObraDetailPage } from "@/pages/app/ObraDetailPage";
import { ObraClientePage } from "@/pages/app/ObraClientePage";
import { DiariasPage } from "@/pages/app/DiariasPage";
import { FinanceiroPage } from "@/pages/app/FinanceiroPage";
import { MembrosPage } from "@/pages/app/MembrosPage";
import { RhPage } from "@/pages/app/RhPage";
import { ConfiguracoesPage } from "@/pages/app/ConfiguracoesPage";
import { PerfilPage } from "@/pages/app/PerfilPage";
import { CalendarioPage } from "@/pages/app/CalendarioPage";
import { rhAdminRoutes } from "@/features/rh";

const rhAdminRouteElements = [
  { path: "/rh/operacional", element: rhAdminRoutes.legacy },
  { path: "/app/rh/operacional", element: rhAdminRoutes.legacy },
  { path: "/rh/funcionarios", element: rhAdminRoutes.funcionarios },
  { path: "/app/rh/funcionarios", element: rhAdminRoutes.funcionarios },
  { path: "/rh/funcionarios/novo", element: rhAdminRoutes.novoFuncionario },
  { path: "/app/rh/funcionarios/novo", element: rhAdminRoutes.novoFuncionario },
  { path: "/rh/funcionarios/:id", element: rhAdminRoutes.funcionarioDetail },
  { path: "/app/rh/funcionarios/:id", element: rhAdminRoutes.funcionarioDetail },
  { path: "/rh/ponto", element: rhAdminRoutes.ponto },
  { path: "/app/rh/ponto", element: rhAdminRoutes.ponto },
  { path: "/rh/ponto/inconsistencias", element: rhAdminRoutes.pontoInconsistencias },
  { path: "/app/rh/ponto/inconsistencias", element: rhAdminRoutes.pontoInconsistencias },
  { path: "/rh/ponto/ajustes", element: rhAdminRoutes.pontoAjustes },
  { path: "/app/rh/ponto/ajustes", element: rhAdminRoutes.pontoAjustes },
  { path: "/rh/ferias", element: rhAdminRoutes.ferias },
  { path: "/app/rh/ferias", element: rhAdminRoutes.ferias },
  { path: "/rh/atestados", element: rhAdminRoutes.atestados },
  { path: "/app/rh/atestados", element: rhAdminRoutes.atestados },
  { path: "/rh/folha", element: rhAdminRoutes.folha },
  { path: "/app/rh/folha", element: rhAdminRoutes.folha },
  { path: "/rh/folha/:ano/:mes", element: rhAdminRoutes.folhaCompetencia },
  { path: "/app/rh/folha/:ano/:mes", element: rhAdminRoutes.folhaCompetencia },
  { path: "/rh/folha/:ano/:mes/fechamento", element: rhAdminRoutes.folhaFechamento },
  { path: "/app/rh/folha/:ano/:mes/fechamento", element: rhAdminRoutes.folhaFechamento },
  { path: "/rh/holerites", element: rhAdminRoutes.holerites },
  { path: "/app/rh/holerites", element: rhAdminRoutes.holerites },
  { path: "/rh/holerites/:id", element: rhAdminRoutes.holeriteDetail },
  { path: "/app/rh/holerites/:id", element: rhAdminRoutes.holeriteDetail },
  { path: "/rh/configuracoes", element: rhAdminRoutes.configuracoes },
  { path: "/app/rh/configuracoes", element: rhAdminRoutes.configuracoes },
  { path: "/rh/configuracoes/beneficios", element: rhAdminRoutes.configuracoesBeneficios },
  { path: "/app/rh/configuracoes/beneficios", element: rhAdminRoutes.configuracoesBeneficios },
  { path: "/rh/configuracoes/encargos", element: rhAdminRoutes.configuracoesEncargos },
  { path: "/app/rh/configuracoes/encargos", element: rhAdminRoutes.configuracoesEncargos },
  { path: "/rh/configuracoes/regras", element: rhAdminRoutes.configuracoesRegras },
  { path: "/app/rh/configuracoes/regras", element: rhAdminRoutes.configuracoesRegras },
  { path: "/rh/configuracoes/tabelas-progressivas", element: rhAdminRoutes.configuracoesTabelasProgressivas },
  { path: "/app/rh/configuracoes/tabelas-progressivas", element: rhAdminRoutes.configuracoesTabelasProgressivas },
  { path: "/rh/auditoria", element: rhAdminRoutes.auditoria },
  { path: "/app/rh/auditoria", element: rhAdminRoutes.auditoria },
] as const;

export const router = createBrowserRouter([
  // Grupo público
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: "/", element: <LandingPage /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/register/team", element: <RegisterTeamPage /> },
      { path: "/register/admin", element: <RegisterAdminPage /> },
    ],
  },
  // Registro por convite — público mas não redireciona autenticados
  { path: "/register", element: <RegisterInvitePage /> },
  { path: "/recovery", element: <RecoveryPage /> },

  // Visualização pública do cliente
  { path: "/obras/:obraId/cliente", element: <ObraClientePage /> },

  // Grupo autenticado
  {
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { path: "/dashboard", element: <DashboardPage /> },
      { path: "/calendario", element: <CalendarioPage /> },
      { path: "/obras", element: <ObrasPage /> },
      { path: "/obras/:obraId", element: <ObraDetailPage /> },
      {
        path: "/diarias",
        element: (
          <ProtectedRoute roles={["admin", "engenheiro", "financeiro", "super_admin"]}>
            <DiariasPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/financeiro",
        element: (
          <ProtectedRoute roles={["admin", "financeiro", "super_admin"]}>
            <FinanceiroPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/rh",
        element: (
          <ProtectedRoute roles={["admin", "financeiro", "funcionario", "super_admin"]}>
            <RhPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/app/rh",
        element: (
          <ProtectedRoute roles={["admin", "financeiro", "funcionario", "super_admin"]}>
            <RhPage />
          </ProtectedRoute>
        ),
      },
      ...rhAdminRouteElements.map((route) => ({
        path: route.path,
        element: (
          <ProtectedRoute roles={["admin", "financeiro", "super_admin"]}>
            {route.element}
          </ProtectedRoute>
        ),
      })),
      {
        path: "/membros",
        element: (
          <ProtectedRoute roles={["admin", "engenheiro", "super_admin"]}>
            <MembrosPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/configuracoes",
        element: (
          <ProtectedRoute roles={["admin", "super_admin"]}>
            <ConfiguracoesPage />
          </ProtectedRoute>
        ),
      },
      { path: "/perfil", element: <PerfilPage /> },
    ],
  },
]);
