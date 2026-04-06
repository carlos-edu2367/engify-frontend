import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  HardHat,
  CalendarDays,
  Wallet,
  Users,
  Settings,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";

const navItems = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "engenheiro", "financeiro", "cliente"],
  },
  {
    to: "/obras",
    label: "Obras",
    icon: HardHat,
    roles: ["admin", "engenheiro", "financeiro"],
  },
  {
    to: "/diarias",
    label: "Diárias",
    icon: CalendarDays,
    roles: ["admin", "engenheiro", "financeiro"],
  },
  {
    to: "/financeiro",
    label: "Financeiro",
    icon: Wallet,
    roles: ["admin", "financeiro"],
  },
  {
    to: "/membros",
    label: "Membros",
    icon: Users,
    roles: ["admin"],
  },
  {
    to: "/configuracoes",
    label: "Configurações",
    icon: Settings,
    roles: ["admin"],
  },
] as const;

export function Sidebar() {
  const user = useAuthStore((s) => s.user);

  const visibleItems = navItems.filter(
    (item) => user && (item.roles as readonly string[]).includes(user.role)
  );

  return (
    <aside className="flex h-full w-60 flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
        <Building2 className="h-6 w-6 text-sidebar-primary" />
        <span className="text-xl font-bold tracking-tight text-sidebar-foreground">Engify</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      {user && (
        <div className="border-t border-sidebar-border px-4 py-3">
          <p className="text-xs font-medium text-sidebar-foreground/90 truncate">{user.nome}</p>
          <p className="text-xs text-sidebar-foreground/50 capitalize">{user.role}</p>
        </div>
      )}
    </aside>
  );
}
