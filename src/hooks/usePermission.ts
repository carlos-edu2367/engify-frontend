import { useAuthStore } from "@/store/auth.store";
import type { Role } from "@/types/auth.types";

export function usePermission() {
  const user = useAuthStore((s) => s.user);

  function hasRole(...roles: Role[]): boolean {
    return !!user && roles.includes(user.role);
  }

  const canEdit = hasRole("admin", "engenheiro");
  const canViewFinanceiro = hasRole("admin", "financeiro");
  const isAdmin = hasRole("admin");

  return { hasRole, canEdit, canViewFinanceiro, isAdmin };
}
