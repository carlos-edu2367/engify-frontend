import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificacoesService } from "@/services/notificacoes.service";

const KEYS = {
  contagem: ["notificacoes", "contagem"] as const,
  list: (page: number, limit: number) => ["notificacoes", "list", page, limit] as const,
};

export function useNotificacoesContagem() {
  return useQuery({
    queryKey: KEYS.contagem,
    queryFn: notificacoesService.contagem,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
}

export function useNotificacoesList(page = 1, limit = 10) {
  return useQuery({
    queryKey: KEYS.list(page, limit),
    queryFn: () => notificacoesService.list({ page, limit }),
    staleTime: 60_000,
  });
}

export function useMarcarLida() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificacoesService.marcarLida(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
    },
  });
}

export function useMarcarTodasLidas() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificacoesService.marcarTodasLidas,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
    },
  });
}
