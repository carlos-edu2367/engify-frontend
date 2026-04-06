import type { ReactNode } from "react";
import { useAuthStore } from "@/store/auth.store";
import type { Role } from "@/types/auth.types";

interface RoleGuardProps {
  roles: Role[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ roles, children, fallback = null }: RoleGuardProps) {
  const user = useAuthStore((s) => s.user);
  if (!user || !roles.includes(user.role)) return <>{fallback}</>;
  return <>{children}</>;
}
