import { useState, useEffect, useRef } from "react";
import { Navigate, Outlet } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuthStore } from "@/store/auth.store";
import type { Role } from "@/types/auth.types";
import { authService } from "@/services/auth.service";

interface ProtectedRouteProps {
  roles?: Role[];
  children?: ReactNode;
}

export function ProtectedRoute({ roles, children }: ProtectedRouteProps) {
  const { isAuthenticated, user, setAccessToken, setUser } = useAuthStore();
  const [initializing, setInitializing] = useState(!isAuthenticated);
  const attempted = useRef(false);

  useEffect(() => {
    // Se já autenticado (não é reload) ou já tentou restaurar, não faz nada
    if (isAuthenticated || attempted.current) {
      setInitializing(false);
      return;
    }
    attempted.current = true;

    // Tenta restaurar sessão usando o cookie HttpOnly do refresh token
    authService
      .refresh()
      .then(({ access_token }) => {
        // Injeta o token no store para que o interceptor axios use nas próximas chamadas
        setAccessToken(access_token);
        return authService.me();
      })
      .then((me) => {
        setUser({
          id: me.id,
          nome: me.nome,
          email: me.email,
          role: me.role,
          teamId: me.team_id,
        });
      })
      .catch(() => {
        // Cookie expirado ou revogado — usuário vai para login
      })
      .finally(() => setInitializing(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
