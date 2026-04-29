import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { rhService } from "@/services/rh.service";
import type { RhDashboardSummary } from "@/types/rh.types";
import { rhQueryKeys } from "../../shared/utils/queryKeys";

function emptySummary(month: number, year: number): RhDashboardSummary {
  return {
    mes: month,
    ano: year,
    total_funcionarios_ativos: 0,
    ajustes_pendentes: 0,
    ferias_em_andamento: 0,
    atestados_aguardando: 0,
    atestados_vencidos: 0,
    pontos_negados_periodo: 0,
    pontos_inconsistentes_periodo: 0,
    holerites_rascunho: 0,
    holerites_fechados: 0,
    total_liquido_competencia: "0",
  };
}

async function getDashboardSummary(month: number, year: number) {
  try {
    return await rhService.getDashboard(month, year);
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 403) {
      throw error;
    }

    // TODO(RH Fase 2): remover fallback quando o endpoint consolidado /rh/dashboard estiver garantido em todos os ambientes.
    const [
      funcionarios,
      ajustes,
      pontosInconsistentes,
      ferias,
      atestadosAguardando,
      atestadosVencidos,
      folhaRascunho,
      folhaFechada,
      folhaAmostra,
    ] =
      await Promise.all([
        rhService.list(1, 1, undefined, true),
        rhService.listAjustes({ page: 1, limit: 1, status: "pendente" }),
        rhService.listPontos({ page: 1, limit: 1, status: "inconsistente" }),
        rhService.listFerias({ page: 1, limit: 1, status: "solicitado" }),
        rhService.listAtestados({ page: 1, limit: 1, status: "aguardando_entrega" }),
        rhService.listAtestados({ page: 1, limit: 1, status: "vencido" }),
        rhService.listFolha({ page: 1, limit: 1, mes: month, ano: year, status: "rascunho" }),
        rhService.listFolha({ page: 1, limit: 1, mes: month, ano: year, status: "fechado" }),
        rhService.listFolha({ page: 1, limit: 20, mes: month, ano: year }),
      ]);

    const summary = emptySummary(month, year);
    summary.total_funcionarios_ativos = funcionarios.total;
    summary.ajustes_pendentes = ajustes.total;
    summary.pontos_inconsistentes_periodo = pontosInconsistentes.total;
    summary.ferias_em_andamento = ferias.total;
    summary.atestados_aguardando = atestadosAguardando.total;
    summary.atestados_vencidos = atestadosVencidos.total;
    summary.holerites_rascunho = folhaRascunho.total;
    summary.holerites_fechados = folhaFechada.total;
    summary.total_liquido_competencia = folhaAmostra.items
      .reduce((total, item) => total + Number(item.valor_liquido || 0), 0)
      .toString();
    return summary;
  }
}

export function useRhDashboard(month: number, year: number) {
  return useQuery({
    queryKey: rhQueryKeys.dashboard(month, year),
    queryFn: () => getDashboardSummary(month, year),
    staleTime: 60_000,
  });
}
