import { api } from "@/lib/axios";
import type {
  RhAjusteFilters,
  RhAjustePontoCreateRequest,
  RhAjustesResponse,
  RhAtestadoCreateRequest,
  RhAtestadoDeliverRequest,
  RhAtestadoDownloadUrlResponse,
  RhAtestadoFilters,
  RhAtestadosResponse,
  RhAuditFilters,
  RhAuditLogsResponse,
  RhDashboardSummary,
  RhFecharFolhaRequest,
  RhFeriasCreateRequest,
  RhFeriasFilters,
  RhFeriasResponse,
  RhFolhaFilters,
  RhFuncionario,
  RhFuncionarioCreateRequest,
  RhFuncionarioUpdateRequest,
  RhFuncionariosResponse,
  RhGerarFolhaRequest,
  RhHolerite,
  RhHoleriteAjustesRequest,
  RhHoleritesResponse,
  RhHorarioTrabalho,
  RhHorarioTrabalhoUpdateRequest,
  RhLocalPonto,
  RhLocalPontoCreateRequest,
  RhLocalPontoUpdateRequest,
  RhLocaisPontoResponse,
  RhMeResumo,
  RhPontoFilters,
  RhRegistrarPontoRequest,
  RhRegistroPonto,
  RhRegistrosPontoResponse,
  RhTipoAtestado,
  RhTipoAtestadoCreateRequest,
  RhTipoAtestadoUpdateRequest,
  RhTiposAtestadoResponse,
} from "@/types/rh.types";

function buildIdempotencyKey(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizePagination<T extends { page?: number; limit?: number }>(filters?: T) {
  return {
    page: filters?.page ?? 1,
    limit: filters?.limit ?? 50,
  };
}

export const rhService = {
  list: (page = 1, limit = 100, search?: string, isActive?: boolean) =>
    api
      .get<RhFuncionariosResponse>("/rh/funcionarios", {
        params: {
          page,
          limit,
          ...(search ? { search } : {}),
          ...(typeof isActive === "boolean" ? { is_active: isActive } : {}),
        },
      })
      .then((r) => r.data),

  getById: (id: string) => api.get<RhFuncionario>(`/rh/funcionarios/${id}`).then((r) => r.data),

  create: (data: RhFuncionarioCreateRequest) =>
    api.post<RhFuncionario>("/rh/funcionarios", data).then((r) => r.data),

  update: (id: string, data: RhFuncionarioUpdateRequest) =>
    api.patch<RhFuncionario>(`/rh/funcionarios/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete<{ message: string }>(`/rh/funcionarios/${id}`).then((r) => r.data),

  getHorario: (funcionarioId: string) =>
    api.get<RhHorarioTrabalho>(`/rh/funcionarios/${funcionarioId}/horario`).then((r) => r.data),

  updateHorario: (funcionarioId: string, data: RhHorarioTrabalhoUpdateRequest) =>
    api.put<RhHorarioTrabalho>(`/rh/funcionarios/${funcionarioId}/horario`, data).then((r) => r.data),

  listLocaisPonto: (funcionarioId: string, page = 1, limit = 50) =>
    api
      .get<RhLocaisPontoResponse>(`/rh/funcionarios/${funcionarioId}/locais-ponto`, {
        params: { page, limit },
      })
      .then((r) => r.data),

  createLocalPonto: (funcionarioId: string, data: RhLocalPontoCreateRequest) =>
    api.post<RhLocalPonto>(`/rh/funcionarios/${funcionarioId}/locais-ponto`, data).then((r) => r.data),

  updateLocalPonto: (localId: string, data: RhLocalPontoUpdateRequest) =>
    api.patch<RhLocalPonto>(`/rh/locais-ponto/${localId}`, data).then((r) => r.data),

  deleteLocalPonto: (localId: string) =>
    api.delete<{ message: string }>(`/rh/locais-ponto/${localId}`).then((r) => r.data),

  getDashboard: (mes: number, ano: number) =>
    api.get<RhDashboardSummary>("/rh/dashboard", { params: { mes, ano } }).then((r) => r.data),

  listAuditLogs: (filters?: RhAuditFilters) =>
    api
      .get<RhAuditLogsResponse>("/rh/audit-logs", {
        params: {
          ...normalizePagination(filters),
          ...(filters?.entity_type ? { entity_type: filters.entity_type } : {}),
          ...(filters?.entity_id ? { entity_id: filters.entity_id } : {}),
          ...(filters?.actor_user_id ? { actor_user_id: filters.actor_user_id } : {}),
          ...(filters?.action ? { action: filters.action } : {}),
          ...(filters?.start ? { start: filters.start } : {}),
          ...(filters?.end ? { end: filters.end } : {}),
        },
      })
      .then((r) => r.data),

  listAjustes: (filters?: RhAjusteFilters) =>
    api
      .get<RhAjustesResponse>("/rh/ajustes-ponto", {
        params: {
          ...normalizePagination(filters),
          ...(filters?.funcionario_id ? { funcionario_id: filters.funcionario_id } : {}),
          ...(filters?.status ? { status: filters.status } : {}),
          ...(filters?.start ? { start: filters.start } : {}),
          ...(filters?.end ? { end: filters.end } : {}),
        },
      })
      .then((r) => r.data),

  createAjuste: (data: RhAjustePontoCreateRequest) =>
    api.post("/rh/ajustes-ponto", data).then((r) => r.data),

  approveAjuste: (id: string) =>
    api.post(`/rh/ajustes-ponto/${id}/aprovar`).then((r) => r.data),

  rejectAjuste: (id: string, motivo: string) =>
    api.post(`/rh/ajustes-ponto/${id}/rejeitar`, { motivo }).then((r) => r.data),

  listFerias: (filters?: RhFeriasFilters) =>
    api
      .get<RhFeriasResponse>("/rh/ferias", {
        params: {
          ...normalizePagination(filters),
          ...(filters?.funcionario_id ? { funcionario_id: filters.funcionario_id } : {}),
          ...(filters?.status ? { status: filters.status } : {}),
          ...(filters?.start ? { start: filters.start } : {}),
          ...(filters?.end ? { end: filters.end } : {}),
        },
      })
      .then((r) => r.data),

  createFerias: (data: RhFeriasCreateRequest) =>
    api.post("/rh/ferias", data).then((r) => r.data),

  approveFerias: (id: string) =>
    api.post(`/rh/ferias/${id}/aprovar`).then((r) => r.data),

  rejectFerias: (id: string, motivo: string) =>
    api.post(`/rh/ferias/${id}/rejeitar`, { motivo }).then((r) => r.data),

  cancelFerias: (id: string, motivo: string) =>
    api.post(`/rh/ferias/${id}/cancelar`, { motivo }).then((r) => r.data),

  listTiposAtestado: (page = 1, limit = 50) =>
    api.get<RhTiposAtestadoResponse>("/rh/tipos-atestado", { params: { page, limit } }).then((r) => r.data),

  createTipoAtestado: (data: RhTipoAtestadoCreateRequest) =>
    api.post<RhTipoAtestado>("/rh/tipos-atestado", data).then((r) => r.data),

  updateTipoAtestado: (id: string, data: RhTipoAtestadoUpdateRequest) =>
    api.patch<RhTipoAtestado>(`/rh/tipos-atestado/${id}`, data).then((r) => r.data),

  deleteTipoAtestado: (id: string) =>
    api.delete<{ message: string }>(`/rh/tipos-atestado/${id}`).then((r) => r.data),

  listAtestados: (filters?: RhAtestadoFilters) =>
    api
      .get<RhAtestadosResponse>("/rh/atestados", {
        params: {
          ...normalizePagination(filters),
          ...(filters?.funcionario_id ? { funcionario_id: filters.funcionario_id } : {}),
          ...(filters?.tipo_atestado_id ? { tipo_atestado_id: filters.tipo_atestado_id } : {}),
          ...(filters?.status ? { status: filters.status } : {}),
          ...(filters?.start ? { start: filters.start } : {}),
          ...(filters?.end ? { end: filters.end } : {}),
        },
      })
      .then((r) => r.data),

  createAtestado: (data: RhAtestadoCreateRequest) =>
    api.post("/rh/atestados", data).then((r) => r.data),

  deliverAtestado: (id: string, data: RhAtestadoDeliverRequest) =>
    api.post(`/rh/atestados/${id}/entregar`, data).then((r) => r.data),

  rejectAtestado: (id: string, motivo: string) =>
    api.post(`/rh/atestados/${id}/rejeitar`, { motivo }).then((r) => r.data),

  getAtestadoDownloadUrl: (id: string) =>
    api.get<RhAtestadoDownloadUrlResponse>(`/rh/atestados/${id}/download-url`).then((r) => r.data),

  generateFolha: (data: RhGerarFolhaRequest) =>
    api.post<RhHolerite[]>("/rh/folha/gerar", data).then((r) => r.data),

  listFolha: (filters: RhFolhaFilters) =>
    api
      .get<RhHoleritesResponse>("/rh/folha", {
        params: {
          ...normalizePagination(filters),
          mes: filters.mes,
          ano: filters.ano,
          ...(filters.status ? { status: filters.status } : {}),
          ...(filters.funcionario_id ? { funcionario_id: filters.funcionario_id } : {}),
        },
      })
      .then((r) => r.data),

  getHolerite: (id: string) =>
    api.get<RhHolerite>(`/rh/holerites/${id}`).then((r) => r.data),

  updateHoleriteAjustes: (id: string, data: RhHoleriteAjustesRequest) =>
    api.patch<RhHolerite>(`/rh/holerites/${id}/ajustes-manuais`, data).then((r) => r.data),

  closeFolha: (data: RhFecharFolhaRequest) =>
    api
      .post<RhHolerite[]>("/rh/folha/fechar", data, {
        headers: { "Idempotency-Key": buildIdempotencyKey("rh-folha") },
      })
      .then((r) => r.data),

  listMyHolerites: (page = 1, limit = 20) =>
    api.get<RhHoleritesResponse>("/rh/me/holerites", { params: { page, limit } }).then((r) => r.data),

  getMyHolerite: (id: string) =>
    api.get<RhHolerite>(`/rh/me/holerites/${id}`).then((r) => r.data),

  getMyResumo: () =>
    api.get<RhMeResumo>("/rh/me/resumo").then((r) => r.data),

  listPontos: (filters?: RhPontoFilters) =>
    api
      .get<RhRegistrosPontoResponse>("/rh/ponto", {
        params: {
          ...normalizePagination(filters),
          ...(filters?.funcionario_id ? { funcionario_id: filters.funcionario_id } : {}),
          ...(filters?.status ? { status: filters.status } : {}),
          ...(filters?.start ? { start: filters.start } : {}),
          ...(filters?.end ? { end: filters.end } : {}),
        },
      })
      .then((r) => r.data),

  listMyPontos: (filters?: Omit<RhPontoFilters, "funcionario_id">) =>
    api
      .get<RhRegistrosPontoResponse>("/rh/me/ponto", {
        params: {
          ...normalizePagination(filters),
          ...(filters?.status ? { status: filters.status } : {}),
          ...(filters?.start ? { start: filters.start } : {}),
          ...(filters?.end ? { end: filters.end } : {}),
        },
      })
      .then((r) => r.data),

  registrarPonto: (data: RhRegistrarPontoRequest) =>
    api
      .post<RhRegistroPonto>("/rh/ponto", data, {
        headers: { "Idempotency-Key": buildIdempotencyKey("rh-ponto") },
      })
      .then((r) => r.data),
};
