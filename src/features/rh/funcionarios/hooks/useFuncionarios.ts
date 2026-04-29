import { useQuery } from "@tanstack/react-query";
import { rhService } from "@/services/rh.service";
import { rhQueryKeys } from "../../shared/utils/queryKeys";

export function useFuncionarios({
  page,
  limit,
  search,
  isActive,
}: {
  page: number;
  limit: number;
  search?: string;
  isActive?: boolean;
}) {
  return useQuery({
    queryKey: rhQueryKeys.funcionarios.list({ page, limit, search, isActive }),
    queryFn: () => rhService.list(page, limit, search || undefined, isActive),
    staleTime: 30_000,
  });
}

export function useFuncionarioDetail(id?: string) {
  return useQuery({
    queryKey: rhQueryKeys.funcionarios.detail(id ?? null),
    queryFn: () => rhService.getById(id!),
    enabled: !!id,
  });
}
