import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuthStore } from "@/store/auth.store";
import type { Role } from "@/types/auth.types";
import { restoreSession } from "@/services/auth-session.service";

interface ProtectedRouteProps {
  roles?: Role[];
  children?: ReactNode;
}

export function ProtectedRoute({ roles, children }: ProtectedRouteProps) {
  const { isAuthenticated, user, isBootstrapping, hasBootstrapped } = useAuthStore();

  useEffect(() => {
    if (!hasBootstrapped && !isBootstrapping) {
      void restoreSession();
    }
  }, [hasBootstrapped, isBootstrapping]);

  if (!hasBootstrapped || isBootstrapping) {
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
