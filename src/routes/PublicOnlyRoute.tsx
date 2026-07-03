import { useEffect } from "react";
import { Navigate, Outlet, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { restoreSession } from "@/services/auth-session.service";
import { getSafeNextPath } from "@/lib/utils";

export function PublicOnlyRoute() {
  const { isAuthenticated, hasBootstrapped, isBootstrapping } = useAuthStore();
  const [params] = useSearchParams();

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

  if (isAuthenticated) {
    const next = getSafeNextPath(params.get("next"));
    return <Navigate to={next ?? "/dashboard"} replace />;
  }
  return <Outlet />;
}
