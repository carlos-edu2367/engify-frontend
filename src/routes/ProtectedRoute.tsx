import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuthStore } from "@/store/auth.store";
import type { Role } from "@/types/auth.types";
import { restoreSession } from "@/services/auth-session.service";
import { SessionBootstrapError } from "@/components/shared/SessionBootstrapError";

interface ProtectedRouteProps {
  roles?: Role[];
  children?: ReactNode;
}

export function ProtectedRoute({ roles, children }: ProtectedRouteProps) {
  const { isAuthenticated, user, isBootstrapping, hasBootstrapped, bootstrapError } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (!hasBootstrapped && !isBootstrapping) {
      void restoreSession();
    }
  }, [hasBootstrapped, isBootstrapping]);

  if (!hasBootstrapped || isBootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Conectando ao servidor...</p>
        </div>
      </div>
    );
  }

  if (bootstrapError) {
    return (
      <SessionBootstrapError
        message={bootstrapError}
        onRetry={() => void restoreSession()}
        showLogin
      />
    );
  }

  if (!isAuthenticated) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    const fallback = user.role === "funcionario" ? "/meu-rh" : "/dashboard";
    return <Navigate to={fallback} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
