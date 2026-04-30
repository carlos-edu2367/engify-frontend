import { NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { rhService } from "@/services/rh.service";
import { getVisibleNavItems } from "./navigation";

interface SidebarProps {
  className?: string;
  compact?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({ className, compact = false, onNavigate }: SidebarProps) {
  const user = useAuthStore((s) => s.user);
  const employeeLinkQuery = useQuery({
    queryKey: ["rh-me-vinculo"],
    queryFn: rhService.getMyVinculo,
    enabled: !!user,
    staleTime: 60_000,
    retry: false,
  });

  const visibleItems = getVisibleNavItems({
    role: user?.role,
    hasEmployeeLink: employeeLinkQuery.data?.vinculado ?? false,
  });

  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground",
        className
      )}
    >
      <div className={cn("flex items-center gap-2 border-b border-sidebar-border px-5", compact ? "h-14" : "h-16")}>
        <Building2 className="h-6 w-6 text-sidebar-primary" />
        <span className="text-xl font-bold tracking-tight text-sidebar-foreground">Engify</span>
      </div>

      <nav className={cn("flex-1 space-y-1 overflow-y-auto px-3", compact ? "py-3" : "py-4")}>
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                compact ? "py-2.5" : "py-2",
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

      {user && (
        <div className="border-t border-sidebar-border px-4 py-3">
          <p className="truncate text-xs font-medium text-sidebar-foreground/90">{user.nome}</p>
          <p className="text-xs capitalize text-sidebar-foreground/50">{user.role}</p>
        </div>
      )}
    </aside>
  );
}
