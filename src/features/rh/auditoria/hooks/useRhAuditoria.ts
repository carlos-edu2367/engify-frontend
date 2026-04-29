import { useQuery } from "@tanstack/react-query";
import { rhService } from "@/services/rh.service";
import type { RhAuditFilters } from "@/types/rh.types";
import { rhQueryKeys } from "../../shared/utils/queryKeys";

export function useRhAuditoria(filters: RhAuditFilters) {
  return useQuery({
    queryKey: rhQueryKeys.auditoria.list(filters),
    queryFn: () => rhService.listAuditLogs(filters),
    staleTime: 15_000,
  });
}
