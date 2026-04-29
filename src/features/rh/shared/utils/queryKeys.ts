import type {
  RhAjusteFilters,
  RhAtestadoFilters,
  RhAuditFilters,
  RhFeriasFilters,
  RhFolhaFilters,
  RhPontoFilters,
} from "@/types/rh.types";

export const rhQueryKeys = {
  all: ["rh"] as const,
  dashboard: (mes: number, ano: number) => [...rhQueryKeys.all, "dashboard", { mes, ano }] as const,
  funcionarios: {
    all: () => [...rhQueryKeys.all, "funcionarios"] as const,
    list: (filters: { page: number; limit: number; search?: string; isActive?: boolean }) =>
      [...rhQueryKeys.funcionarios.all(), "list", filters] as const,
    detail: (id: string | null) => [...rhQueryKeys.funcionarios.all(), "detail", id] as const,
  },
  ponto: {
    list: (filters?: RhPontoFilters) => [...rhQueryKeys.all, "ponto", "list", filters ?? {}] as const,
  },
  ajustes: {
    list: (filters?: RhAjusteFilters) => [...rhQueryKeys.all, "ajustes", "list", filters ?? {}] as const,
  },
  ferias: {
    list: (filters?: RhFeriasFilters) => [...rhQueryKeys.all, "ferias", "list", filters ?? {}] as const,
  },
  atestados: {
    list: (filters?: RhAtestadoFilters) => [...rhQueryKeys.all, "atestados", "list", filters ?? {}] as const,
  },
  folha: {
    list: (filters: RhFolhaFilters) => [...rhQueryKeys.all, "folha", "list", filters] as const,
    jobs: (filters: Record<string, unknown>) => [...rhQueryKeys.all, "folha", "jobs", filters] as const,
  },
  holerites: {
    detail: (id: string | null) => [...rhQueryKeys.all, "holerites", "detail", id] as const,
    itens: (id: string | null) => [...rhQueryKeys.all, "holerites", "itens", id] as const,
    snapshot: (id: string | null, itemId: string | null) => [...rhQueryKeys.all, "holerites", "snapshot", id, itemId] as const,
    list: (filters: Record<string, unknown>) => [...rhQueryKeys.all, "holerites", "list", filters] as const,
  },
  auditoria: {
    list: (filters?: RhAuditFilters) => [...rhQueryKeys.all, "auditoria", "list", filters ?? {}] as const,
  },
  encargos: {
    regras: (filters?: Record<string, unknown>) => [...rhQueryKeys.all, "encargos", "regras", filters ?? {}] as const,
    tabelas: (filters?: Record<string, unknown>) => [...rhQueryKeys.all, "encargos", "tabelas", filters ?? {}] as const,
    beneficios: (filters?: Record<string, unknown>) => [...rhQueryKeys.all, "encargos", "beneficios", filters ?? {}] as const,
  },
};
