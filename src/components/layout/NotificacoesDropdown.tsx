import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Building2, MessageSquare, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  useNotificacoesContagem,
  useNotificacoesList,
  useMarcarLida,
  useMarcarTodasLidas,
} from "@/hooks/useNotificacoes";
import type { NotificacaoResponse, NotificacaoTipo } from "@/types/notificacoes.types";
import { cn } from "@/lib/utils";

function getNavDestino(notificacao: NotificacaoResponse): string | null {
  if (!notificacao.reference_id) return null;
  if (notificacao.tipo === "mencao_mural") {
    return `/obras/${notificacao.reference_id}?tab=mural`;
  }
  return `/obras/${notificacao.reference_id}`;
}

function NotificacaoIcon({ tipo }: { tipo: NotificacaoTipo }) {
  if (tipo === "mencao_mural") {
    return <MessageSquare className="h-4 w-4 shrink-0 text-blue-500" />;
  }
  if (tipo === "prazo_1_dia") {
    return <Clock className="h-4 w-4 shrink-0 text-red-500" />;
  }
  return <Building2 className="h-4 w-4 shrink-0 text-amber-500" />;
}

export function NotificacoesDropdown() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const { data: contagemData } = useNotificacoesContagem();
  const { data: listData, isLoading } = useNotificacoesList(1, 10);
  const marcarLida = useMarcarLida();
  const marcarTodas = useMarcarTodasLidas();

  const naoLidas = contagemData?.nao_lidas ?? 0;
  const notificacoes = listData?.items ?? [];

  function handleClickNotificacao(notificacao: NotificacaoResponse) {
    const destino = getNavDestino(notificacao);
    if (!notificacao.lida) {
      marcarLida.mutate(notificacao.id);
    }
    setOpen(false);
    if (destino) navigate(destino);
  }

  function handleMarcarTodas() {
    marcarTodas.mutate();
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="relative rounded-full outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Notificações"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-accent">
            <Bell className="h-5 w-5" />
            {naoLidas > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                {naoLidas > 9 ? "9+" : naoLidas}
              </span>
            )}
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2.5">
          <DropdownMenuLabel className="p-0 text-sm font-semibold">
            Notificações
          </DropdownMenuLabel>
          {naoLidas > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs text-muted-foreground"
              onClick={handleMarcarTodas}
              disabled={marcarTodas.isPending}
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <DropdownMenuSeparator className="my-0" />

        <div className="max-h-[360px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              Carregando...
            </div>
          ) : notificacoes.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1 py-8">
              <Bell className="h-6 w-6 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
            </div>
          ) : (
            notificacoes.map((n) => (
              <button
                key={n.id}
                className={cn(
                  "flex w-full items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-accent",
                  !n.lida && "bg-accent/40"
                )}
                onClick={() => handleClickNotificacao(n)}
              >
                <div className="mt-0.5">
                  <NotificacaoIcon tipo={n.tipo} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm leading-snug", !n.lida && "font-medium")}>
                    {n.titulo}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {n.mensagem}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground/70">
                    {formatDistanceToNow(new Date(n.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                </div>
                {!n.lida && (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                )}
              </button>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
