import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { restoreSession } from "@/services/auth-session.service";

export function PublicOnlyRoute() {
  const { isAuthenticated, hasBootstrapped, isBootstrapping } = useAuthStore();

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

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
