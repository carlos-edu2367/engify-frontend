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
          <ProtectedRoute roles={["admin", "engenheiro", "financeiro"]}>
            <DiariasPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/financeiro",
        element: (
          <ProtectedRoute roles={["admin", "financeiro"]}>
            <FinanceiroPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/rh",
        element: (
          <ProtectedRoute roles={["admin", "financeiro", "funcionario"]}>
            <RhPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/membros",
        element: (
          <ProtectedRoute roles={["admin", "engenheiro"]}>
            <MembrosPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/configuracoes",
        element: (
          <ProtectedRoute roles={["admin"]}>
            <ConfiguracoesPage />
          </ProtectedRoute>
        ),
      },
      { path: "/perfil", element: <PerfilPage /> },
    ],
  },
]);
