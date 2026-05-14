import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AtSign,
  Bell,
  Building2,
  CheckSquare,
  Clock,
  MailCheck,
  MailOpen,
  MessageSquare,
  Square,
} from "lucide-react";
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
  useMarcarMultiplasLidas,
  useMarcarNaoLida,
  useMarcarTodasLidas,
} from "@/hooks/useNotificacoes";
import type { NotificacaoResponse, NotificacaoTipo } from "@/types/notificacoes.types";
import { cn } from "@/lib/utils";

type NotificationFilter = "todas" | "mencoes";

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
  const [filter, setFilter] = useState<NotificationFilter>("todas");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: contagemData } = useNotificacoesContagem();
  const { data: listData, isLoading } = useNotificacoesList(1, 10);
  const marcarLida = useMarcarLida();
  const marcarNaoLida = useMarcarNaoLida();
  const marcarMultiplas = useMarcarMultiplasLidas();
  const marcarTodas = useMarcarTodasLidas();

  const naoLidas = contagemData?.nao_lidas ?? 0;
  const notificacoes = listData?.items ?? [];
  const filteredNotificacoes = useMemo(
    () => filter === "mencoes"
      ? notificacoes.filter((n) => n.tipo === "mencao_mural")
      : notificacoes,
    [filter, notificacoes]
  );
  const selectedUnreadIds = filteredNotificacoes
    .filter((n) => selectedIds.has(n.id) && !n.lida)
    .map((n) => n.id);
  const allVisibleSelected = filteredNotificacoes.length > 0
    && filteredNotificacoes.every((n) => selectedIds.has(n.id));

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

  function toggleSelected(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectVisible() {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allVisibleSelected) {
        filteredNotificacoes.forEach((n) => next.delete(n.id));
      } else {
        filteredNotificacoes.forEach((n) => next.add(n.id));
      }
      return next;
    });
  }

  function handleMarcarSelecionadas() {
    if (selectedUnreadIds.length === 0) return;
    marcarMultiplas.mutate(selectedUnreadIds, {
      onSuccess: () => setSelectedIds(new Set()),
    });
  }

  function handleToggleLida(notificacao: NotificacaoResponse) {
    if (notificacao.lida) {
      marcarNaoLida.mutate(notificacao.id);
    } else {
      marcarLida.mutate(notificacao.id);
    }
  }

  function handleFilterChange(nextFilter: NotificationFilter) {
    setFilter(nextFilter);
    setSelectedIds(new Set());
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

      <DropdownMenuContent align="end" className="w-[380px] p-0">
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

        <div className="flex items-center justify-between gap-2 px-3 py-2">
          <div className="flex rounded-md border p-0.5">
            <Button
              type="button"
              variant={filter === "todas" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => handleFilterChange("todas")}
            >
              Todas
            </Button>
            <Button
              type="button"
              variant={filter === "mencoes" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => handleFilterChange("mencoes")}
            >
              <AtSign className="h-3.5 w-3.5" />
              Menções
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={toggleSelectVisible}
              disabled={filteredNotificacoes.length === 0}
              title={allVisibleSelected ? "Limpar seleção" : "Selecionar visíveis"}
            >
              {allVisibleSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleMarcarSelecionadas}
              disabled={selectedUnreadIds.length === 0 || marcarMultiplas.isPending}
            >
              <MailCheck className="h-3.5 w-3.5" />
              Lidas
            </Button>
          </div>
        </div>
        <DropdownMenuSeparator className="my-0" />

        <div className="max-h-[360px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              Carregando...
            </div>
          ) : filteredNotificacoes.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1 py-8">
              <Bell className="h-6 w-6 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {filter === "mencoes" ? "Nenhuma menção" : "Nenhuma notificação"}
              </p>
            </div>
          ) : (
            filteredNotificacoes.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "flex w-full items-start gap-2 px-3 py-3 text-left transition-colors hover:bg-accent",
                  !n.lida && "bg-accent/40"
                )}
              >
                <button
                  type="button"
                  className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleSelected(n.id);
                  }}
                  aria-label={selectedIds.has(n.id) ? "Remover da seleção" : "Selecionar notificação"}
                >
                  {selectedIds.has(n.id) ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                </button>
                <div className="mt-0.5">
                  <NotificacaoIcon tipo={n.tipo} />
                </div>
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => handleClickNotificacao(n)}
                >
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
                </button>
                <button
                  type="button"
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-50"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleToggleLida(n);
                  }}
                  aria-label={n.lida ? "Marcar como não lida" : "Marcar como lida"}
                  title={n.lida ? "Marcar como não lida" : "Marcar como lida"}
                  disabled={marcarLida.isPending || marcarNaoLida.isPending}
                >
                  {n.lida ? <MailOpen className="h-4 w-4" /> : <MailCheck className="h-4 w-4" />}
                </button>
                {!n.lida && <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
