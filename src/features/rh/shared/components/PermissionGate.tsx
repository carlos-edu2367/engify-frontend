import type { ReactNode } from "react";
import { RhErrorState } from "./RhErrorState";
import { useRhPermission, type RhPermission } from "../hooks/useRhPermission";

export function PermissionGate({
  permission,
  children,
  fallback = null,
  showDeniedState = false,
}: {
  permission: RhPermission;
  children: ReactNode;
  fallback?: ReactNode;
  showDeniedState?: boolean;
}) {
  const { allowed } = useRhPermission(permission);

  if (allowed) {
    return <>{children}</>;
  }

  if (showDeniedState) {
    return (
      <RhErrorState
        title="Acesso nao permitido"
        description="Seu perfil nao possui permissao para acessar esta area do RH."
      />
    );
  }

  return <>{fallback}</>;
}
