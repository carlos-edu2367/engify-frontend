import { useQuery } from "@tanstack/react-query";
import { obrasService } from "@/services/obras.service";

export function useObraFinanceiroResumo(obraId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["obras", obraId, "financeiro", "resumo"],
    queryFn: () => obrasService.getFinanceiroResumo(obraId!),
    enabled: !!obraId && enabled,
    staleTime: 5 * 60 * 1000,
  });
}
