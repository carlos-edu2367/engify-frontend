import type { PaginatedResponse } from "./api.types";

export interface RhIntervaloHorario {
  hora_inicio: string;
  hora_fim: string;
}

export interface RhTurnoHorario {
  dia_semana: number;
  hora_entrada: string;
  hora_saida: string;
  intervalos?: RhIntervaloHorario[];
}

export interface RhHorarioTrabalho {
  id: string;
  funcionario_id: string;
  turnos: RhTurnoHorario[];
}

export interface RhLocalPonto {
  id: string;
  funcionario_id: string;
  nome: string;
  latitude: number;
  longitude: number;
  raio_metros: number;
}

export interface RhLocalPontoCreateRequest {
  nome: string;
  latitude: number;
  longitude: number;
  raio_metros: number;
}

export interface RhLocalPontoUpdateRequest {
  nome?: string;
  latitude?: number;
  longitude?: number;
  raio_metros?: number;
}

export interface RhFuncionarioListItem {
  id: string;
  nome: string;
  cpf_mascarado: string;
  cargo: string;
  salario_base: string;
  data_admissao: string;
  user_id: string | null;
  is_active: boolean;
}

export interface RhFuncionario extends RhFuncionarioListItem {
  cpf: string;
  horario_trabalho: RhHorarioTrabalho | null;
}

export interface RhFuncionarioCreateRequest {
  nome: string;
  cpf: string;
  cargo: string;
  salario_base: string;
  data_admissao: string;
  user_id?: string | null;
  horario_trabalho: {
    turnos: RhTurnoHorario[];
  };
}

export interface RhFuncionarioUpdateRequest {
  nome?: string;
  cpf?: string;
  cargo?: string;
  salario_base?: string;
  data_admissao?: string;
  user_id?: string | null;
  is_active?: boolean;
  reason?: string | null;
}

export interface RhHorarioTrabalhoUpdateRequest {
  turnos: RhTurnoHorario[];
}

export type RhFuncionariosResponse = PaginatedResponse<RhFuncionarioListItem>;
export type RhLocaisPontoResponse = PaginatedResponse<RhLocalPonto>;

export type RhStatusFerias = "solicitado" | "aprovado" | "em_andamento" | "concluido" | "cancelado" | "rejeitado";
export type RhStatusAjuste = "pendente" | "aprovado" | "rejeitado";
export type RhStatusAtestado = "aguardando_entrega" | "entregue" | "vencido" | "rejeitado";
export type RhStatusHolerite = "rascunho" | "fechado" | "cancelado";
export type RhTipoPonto = "entrada" | "saida";
export type RhStatusPonto = "validado" | "negado" | "inconsistente" | "ajustado";

export interface RhFerias {
  id: string;
  funcionario_id: string;
  data_inicio: string;
  data_fim: string;
  status: RhStatusFerias;
  motivo_rejeicao?: string | null;
}

export interface RhAjustePonto {
  id: string;
  funcionario_id: string;
  data_referencia: string;
  justificativa: string;
  hora_entrada_solicitada?: string | null;
  hora_saida_solicitada?: string | null;
  status: RhStatusAjuste;
  motivo_rejeicao?: string | null;
}

export interface RhTipoAtestado {
  id: string;
  nome: string;
  prazo_entrega_dias: number;
  abona_falta: boolean;
  descricao?: string | null;
}

export interface RhAtestado {
  id: string;
  funcionario_id: string;
  tipo_atestado_id: string;
  data_inicio: string;
  data_fim: string;
  status: RhStatusAtestado;
  motivo_rejeicao?: string | null;
  has_file: boolean;
}

export interface RhTipoAtestadoCreateRequest {
  nome: string;
  prazo_entrega_dias: number;
  abona_falta: boolean;
  descricao?: string | null;
}

export interface RhTipoAtestadoUpdateRequest {
  nome?: string;
  prazo_entrega_dias?: number;
  abona_falta?: boolean;
  descricao?: string | null;
}

export interface RhHolerite {
  id: string;
  funcionario_id: string;
  mes_referencia: number;
  ano_referencia: number;
  salario_base: string;
  horas_extras: string;
  descontos_falta: string;
  acrescimos_manuais: string;
  descontos_manuais: string;
  valor_liquido: string;
  status: RhStatusHolerite;
  pagamento_agendado_id?: string | null;
}

export interface RhGerarFolhaRequest {
  mes: number;
  ano: number;
  funcionario_id?: string | null;
}

export interface RhFecharFolhaRequest {
  mes: number;
  ano: number;
  funcionario_ids?: string[] | null;
}

export interface RhHoleriteAjustesRequest {
  acrescimos_manuais: string;
  descontos_manuais: string;
  motivo: string;
}

export interface RhRegistroPonto {
  id: string;
  funcionario_id: string;
  tipo: RhTipoPonto;
  timestamp: string;
  status: RhStatusPonto;
  local_ponto_id?: string | null;
}

export interface RhRegistrarPontoRequest {
  tipo: RhTipoPonto;
  latitude: number;
  longitude: number;
  client_timestamp?: string | null;
  gps_accuracy_meters?: number | null;
  device_fingerprint?: string | null;
}

export interface RhDashboardSummary {
  mes: number;
  ano: number;
  total_funcionarios_ativos: number;
  ajustes_pendentes: number;
  ferias_em_andamento: number;
  atestados_aguardando: number;
  atestados_vencidos: number;
  pontos_negados_periodo: number;
  pontos_inconsistentes_periodo: number;
  holerites_rascunho: number;
  holerites_fechados: number;
  total_liquido_competencia: string;
}

export interface RhUltimoPontoResumo {
  tipo: RhTipoPonto;
  status: RhStatusPonto;
  timestamp: string;
}

export interface RhUltimoHoleriteResumo {
  mes_referencia: number;
  ano_referencia: number;
  valor_liquido: string;
  status: RhStatusHolerite;
}

export interface RhMeResumo {
  ultimo_ponto?: RhUltimoPontoResumo | null;
  ajustes_pendentes: number;
  ferias_pendentes: number;
  atestados_pendentes: number;
  ultimo_holerite_fechado?: RhUltimoHoleriteResumo | null;
}

export interface RhAuditLog {
  id: string;
  entity_type: string;
  entity_id?: string | null;
  action: string;
  actor_user_id?: string | null;
  actor_role: string;
  reason?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  request_id?: string | null;
  ip_hash?: string | null;
  user_agent?: string | null;
  created_at: string;
}

export interface RhFeriasCreateRequest {
  funcionario_id?: string | null;
  data_inicio: string;
  data_fim: string;
}

export interface RhAjustePontoCreateRequest {
  funcionario_id?: string | null;
  data_referencia: string;
  justificativa: string;
  hora_entrada_solicitada?: string | null;
  hora_saida_solicitada?: string | null;
}

export interface RhAtestadoCreateRequest {
  funcionario_id?: string | null;
  tipo_atestado_id: string;
  data_inicio: string;
  data_fim: string;
  file_path?: string | null;
}

export interface RhAtestadoDeliverRequest {
  file_path: string;
}

export interface RhAtestadoDownloadUrlResponse {
  download_url: string;
  expires_in: number;
}

export interface RhPaginationFilters {
  page?: number;
  limit?: number;
}

export interface RhDateRangeFilters {
  start?: string;
  end?: string;
}

export interface RhPontoFilters extends RhPaginationFilters, RhDateRangeFilters {
  funcionario_id?: string;
  status?: RhStatusPonto;
}

export interface RhFeriasFilters extends RhPaginationFilters, RhDateRangeFilters {
  funcionario_id?: string;
  status?: RhStatusFerias;
}

export interface RhAjusteFilters extends RhPaginationFilters, RhDateRangeFilters {
  funcionario_id?: string;
  status?: RhStatusAjuste;
}

export interface RhAtestadoFilters extends RhPaginationFilters, RhDateRangeFilters {
  funcionario_id?: string;
  tipo_atestado_id?: string;
  status?: RhStatusAtestado;
}

export interface RhAuditFilters extends RhPaginationFilters, RhDateRangeFilters {
  entity_type?: string;
  entity_id?: string;
  actor_user_id?: string;
  action?: string;
}

export interface RhFolhaFilters extends RhPaginationFilters {
  mes: number;
  ano: number;
  status?: RhStatusHolerite;
  funcionario_id?: string;
}

export type RhFeriasResponse = PaginatedResponse<RhFerias>;
export type RhAjustesResponse = PaginatedResponse<RhAjustePonto>;
export type RhTiposAtestadoResponse = PaginatedResponse<RhTipoAtestado>;
export type RhAtestadosResponse = PaginatedResponse<RhAtestado>;
export type RhHoleritesResponse = PaginatedResponse<RhHolerite>;
export type RhRegistrosPontoResponse = PaginatedResponse<RhRegistroPonto>;
export type RhAuditLogsResponse = PaginatedResponse<RhAuditLog>;
