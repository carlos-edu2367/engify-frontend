import { useAuthStore } from "@/store/auth.store";
import type { Role } from "@/types/auth.types";

export type RhPermission =
  | "rh.dashboard.view"
  | "rh.funcionarios.view"
  | "rh.funcionarios.create"
  | "rh.funcionarios.update"
  | "rh.funcionarios.update_salary"
  | "rh.funcionarios.delete"
  | "rh.ponto.view"
  | "rh.ponto.adjust"
  | "rh.ponto.approve_adjustment"
  | "rh.ferias.view"
  | "rh.ferias.approve"
  | "rh.atestados.view"
  | "rh.atestados.validate"
  | "rh.folha.view"
  | "rh.folha.calculate"
  | "rh.folha.close"
  | "rh.holerites.view_sensitive"
  | "rh.holerites.update_manual_adjustments"
  | "rh.regras.view"
  | "rh.regras.create"
  | "rh.regras.activate"
  | "rh.regras.inactivate"
  | "rh.auditoria.view";

const adminPermissions: RhPermission[] = [
  "rh.dashboard.view",
  "rh.funcionarios.view",
  "rh.funcionarios.create",
  "rh.funcionarios.update",
  "rh.funcionarios.update_salary",
  "rh.funcionarios.delete",
  "rh.ponto.view",
  "rh.ponto.adjust",
  "rh.ponto.approve_adjustment",
  "rh.ferias.view",
  "rh.ferias.approve",
  "rh.atestados.view",
  "rh.atestados.validate",
  "rh.folha.view",
  "rh.folha.calculate",
  "rh.folha.close",
  "rh.holerites.view_sensitive",
  "rh.holerites.update_manual_adjustments",
  "rh.regras.view",
  "rh.regras.create",
  "rh.regras.activate",
  "rh.regras.inactivate",
  "rh.auditoria.view",
];

const permissionsByRole: Record<Role, RhPermission[]> = {
  admin: adminPermissions,
  financeiro: adminPermissions,
  super_admin: adminPermissions,
  funcionario: ["rh.dashboard.view"],
  engenheiro: [],
  cliente: [],
};

export function hasRhPermission(role: Role | undefined, permission: RhPermission) {
  if (!role) {
    return false;
  }
  return permissionsByRole[role]?.includes(permission) ?? false;
}

export function useRhPermission(permission?: RhPermission) {
  const role = useAuthStore((state) => state.user?.role);
  const can = (nextPermission: RhPermission) => hasRhPermission(role, nextPermission);

  return {
    role,
    can,
    allowed: permission ? can(permission) : true,
  };
}
