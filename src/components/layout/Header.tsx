import { useLocation, Link } from "react-router-dom";
import { LogOut, User } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

const breadcrumbMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/obras": "Obras",
  "/diarias": "Diárias",
  "/financeiro": "Financeiro",
  "/membros": "Membros",
  "/configuracoes": "Configurações",
  "/perfil": "Meu Perfil",
};

export function Header() {
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
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <h1 className="text-lg font-semibold">{pageTitle}</h1>

      <div className="flex items-center gap-2">
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
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
    </header>
  );
}
