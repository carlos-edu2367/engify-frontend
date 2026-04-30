import {
  LayoutDashboard,
  HardHat,
  CalendarDays,
  Calendar,
  Wallet,
  Users,
  UserCog,
  Settings,
  Building2,
} from "lucide-react";
import type { Role } from "@/types/auth.types";

export const navItems = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "engenheiro", "financeiro", "cliente", "super_admin", "funcionario"],
  },
  {
    to: "/obras",
    label: "Obras",
    icon: HardHat,
    roles: ["admin", "engenheiro", "financeiro", "super_admin"],
  },
  {
    to: "/calendario",
    label: "CalendÃ¡rio",
    icon: Calendar,
    roles: ["admin", "engenheiro", "financeiro", "cliente", "super_admin", "funcionario"],
  },
  {
    to: "/diarias",
    label: "DiÃ¡rias",
    icon: CalendarDays,
    roles: ["admin", "engenheiro", "financeiro", "super_admin"],
  },
  {
    to: "/financeiro",
    label: "Financeiro",
    icon: Wallet,
    roles: ["admin", "financeiro", "super_admin"],
  },
  {
    to: "/rh",
    label: "RH",
    icon: UserCog,
    roles: ["admin", "financeiro", "super_admin"],
  },
  {
    to: "/meu-rh",
    label: "Meu RH",
    icon: Building2,
    roles: ["admin", "engenheiro", "financeiro", "cliente", "super_admin", "funcionario"],
    requiresEmployeeLink: true,
  },
  {
    to: "/membros",
    label: "Membros",
    icon: Users,
    roles: ["admin", "super_admin"],
  },
  {
    to: "/configuracoes",
    label: "ConfiguraÃ§Ãµes",
    icon: Settings,
    roles: ["admin", "super_admin"],
  },
] as const;

export type NavItem = (typeof navItems)[number];

export function getVisibleNavItems({ role, hasEmployeeLink }: { role?: Role; hasEmployeeLink: boolean }) {
  if (!role) {
    return [];
  }
  return navItems.filter((item) => {
    const roleAllowed = (item.roles as readonly string[]).includes(role);
    const linkAllowed = !("requiresEmployeeLink" in item) || !item.requiresEmployeeLink || hasEmployeeLink;
    return roleAllowed && linkAllowed;
  });
}
