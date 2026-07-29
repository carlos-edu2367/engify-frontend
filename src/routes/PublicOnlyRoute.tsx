import { useEffect } from "react";
import { Navigate, Outlet, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { restoreSession } from "@/services/auth-session.service";
import { getSafeNextPath } from "@/lib/utils";
import { SessionBootstrapError } from "@/components/shared/SessionBootstrapError";

export function PublicOnlyRoute() {
  const { isAuthenticated, hasBootstrapped, isBootstrapping, bootstrapError } = useAuthStore();
  const [params] = useSearchParams();

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
      <>
        <SessionBootstrapError
          compact
          message={bootstrapError}
          onRetry={() => void restoreSession()}
        />
        <Outlet />
      </>
    );
  }

  if (isAuthenticated) {
    const next = getSafeNextPath(params.get("next"));
    return <Navigate to={next ?? "/dashboard"} replace />;
  }
  return <Outlet />;
}
