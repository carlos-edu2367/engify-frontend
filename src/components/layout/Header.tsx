import { useLocation, Link } from "react-router-dom";
import { LogOut, Menu, User } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/auth.store";
import { authService } from "@/services/auth.service";
import { getInitials } from "@/lib/utils";
import { queryClient } from "@/lib/query-client";
import { NotificacoesDropdown } from "@/components/layout/NotificacoesDropdown";

const breadcrumbMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/obras": "Obras",
  "/diarias": "Diárias",
  "/financeiro": "Financeiro",
  "/membros": "Membros",
  "/configuracoes": "Configurações",
  "/perfil": "Meu Perfil",
};

interface HeaderProps {
  onOpenMobileNav?: () => void;
}

export function Header({ onOpenMobileNav }: HeaderProps) {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const basePath = "/" + location.pathname.split("/")[1];
  const pageTitle = breadcrumbMap[basePath] ?? "Engify";

  async function handleLogout() {
    try {
      await authService.logout();
    } catch {
      // ignora erro de rede no logout
    } finally {
      logout();
      queryClient.clear();
      window.location.href = "/login";
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 px-4 pt-[max(env(safe-area-inset-top),0px)] backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6">
      <div className="flex h-14 items-center justify-between sm:h-16">
        <div className="flex min-w-0 items-center gap-2.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 lg:hidden"
            onClick={onOpenMobileNav}
            aria-label="Abrir menu de navegacao"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="truncate text-base font-semibold sm:text-lg">{pageTitle}</h1>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <NotificacoesDropdown />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <Avatar className="h-9 w-9 cursor-pointer">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {user ? getInitials(user.nome) : "?"}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>
                <p className="font-medium">{user?.nome}</p>
                <p className="text-xs text-muted-foreground font-normal capitalize">{user?.role}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/perfil">
                  <User className="mr-2 h-4 w-4" />
                  Meu Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => {
                  toast.promise(handleLogout(), {
                    loading: "Saindo...",
                    error: "Erro ao sair",
                  });
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
