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
  salario_base?: string | null;
  can_view_salary?: boolean;
  data_admissao: string;
  user_id: string | null;
  usuario_nome?: string | null;
  usuario_email?: string | null;
  usuario_vinculado?: {
    nome: string;
    email: string;
    avatar_url?: string | null;
  } | null;
  updated_at?: string | null;
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

export interface RhEmployeeDisplayFields {
  funcionario_nome?: string | null;
  funcionario_cpf_mascarado?: string | null;
  funcionario_cargo?: string | null;
}

export interface RhFerias extends RhEmployeeDisplayFields {
  id: string;
  funcionario_id: string;
  data_inicio: string;
  data_fim: string;
  status: RhStatusFerias;
  motivo_rejeicao?: string | null;
}

export interface RhAjustePonto extends RhEmployeeDisplayFields {
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

export interface RhAtestado extends RhEmployeeDisplayFields {
  id: string;
  funcionario_id: string;
  tipo_atestado_id: string;
  tipo_atestado_nome?: string | null;
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

export interface RhHolerite extends RhEmployeeDisplayFields {
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
  valor_bruto?: string | null;
  total_proventos?: string | null;
  total_descontos?: string | null;
  total_informativos?: string | null;
  calculation_version?: number | string | null;
  calculated_at?: string | null;
  status: RhStatusHolerite;
  pagamento_agendado_id?: string | null;
  pagamento_agendado_titulo?: string | null;
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

export interface RhRegistroPonto extends RhEmployeeDisplayFields {
  id: string;
  funcionario_id: string;
  tipo: RhTipoPonto;
  timestamp: string;
  status: RhStatusPonto;
  local_ponto_id?: string | null;
  local_ponto_nome?: string | null;
  fora_local_autorizado?: boolean | null;
  latitude?: number | null;
  longitude?: number | null;
  gps_accuracy_meters?: number | null;
  distancia_local_metros?: number | null;
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
  entity_label?: string | null;
  action: string;
  actor_nome?: string | null;
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

export interface RhAtestadoUploadUrlRequest {
  file_name: string;
  content_type: string;
  size_bytes?: number | null;
}

export interface RhAtestadoUploadUrlResponse {
  upload_url: string;
  storage_key?: string | null;
  headers?: Record<string, string>;
  expires_in: number;
}

export interface RhAtestadoConfirmUploadRequest {
  storage_key?: string | null;
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
  entity_search?: string;
  actor_search?: string;
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

export type RhHoleriteItemNatureza = "provento" | "desconto" | "informativo";
export type RhHoleriteItemOrigem = "sistema" | "regra" | "manual" | "legado";

export interface RhHoleriteItem {
  id: string;
  holerite_id: string;
  descricao: string;
  natureza: RhHoleriteItemNatureza;
  origem: RhHoleriteItemOrigem;
  valor: string;
  regra_nome?: string | null;
  regra_codigo?: string | null;
  regra_versao?: number | string | null;
  base_calculo?: string | null;
  calculation_summary?: string | null;
}

export interface RhHoleriteSnapshot {
  item_id: string;
  titulo?: string | null;
  calculo?: Record<string, unknown> | null;
  linhas?: Array<{ label: string; value: string }>;
}

export type RhHoleriteItensResponse = PaginatedResponse<RhHoleriteItem> | RhHoleriteItem[];

export type RhFolhaJobStatus = "queued" | "running" | "completed" | "failed" | "canceled" | "partial";

export interface RhFolhaJob {
  id: string;
  mes: number;
  ano: number;
  status: RhFolhaJobStatus;
  progress_percent?: number | null;
  processed_count?: number | null;
  total_count?: number | null;
  failed_count?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  mensagem?: string | null;
}

export type RhFolhaJobsResponse = PaginatedResponse<RhFolhaJob>;

export interface RhPontoDiaDetalhe extends RhEmployeeDisplayFields {
  funcionario_id: string;
  data: string;
  status: string;
  registros: RhRegistroPonto[];
  local_autorizado_nome?: string | null;
  locais_autorizados?: RhLocalPonto[];
  fora_local_autorizado?: boolean | null;
  distancia_local_metros?: number | null;
  ajustes_relacionados?: RhAjustePonto[];
  impacto_estimado?: {
    horas_extras?: string | null;
    faltas?: string | null;
    competencia?: string | null;
  } | null;
}

export interface RhRegraEncargo {
  id: string;
  nome: string;
  codigo: string;
  status: "rascunho" | "ativo" | "inativo" | "arquivado";
  natureza: string;
  tipo_calculo: string;
  base_calculo?: string | null;
  versao?: number | string | null;
  vigencia_inicio?: string | null;
  vigencia_fim?: string | null;
}

export type RhRegrasEncargosResponse = PaginatedResponse<RhRegraEncargo>;

export interface RhRegraEncargoCreateRequest {
  nome: string;
  codigo: string;
  natureza: string;
  tipo_calculo: string;
  base_calculo?: string | null;
  valor_fixo?: string | null;
  percentual?: string | null;
  tabela_progressiva_id?: string | null;
  prioridade?: number | null;
  vigencia_inicio?: string | null;
  vigencia_fim?: string | null;
}

export interface RhTabelaProgressiva {
  id: string;
  nome: string;
  codigo: string;
  status: "rascunho" | "ativo" | "inativo";
  vigencia_inicio?: string | null;
  vigencia_fim?: string | null;
  faixas?: RhFaixaEncargo[];
}

export interface RhFaixaEncargo {
  id?: string;
  ordem: number;
  valor_inicial: string;
  valor_final?: string | null;
  aliquota: string;
  deducao?: string | null;
  calculo_marginal?: boolean;
}

export type RhTabelasProgressivasResponse = PaginatedResponse<RhTabelaProgressiva>;

export interface RhTabelaProgressivaCreateRequest {
  nome: string;
  codigo: string;
  descricao?: string | null;
  vigencia_inicio?: string | null;
  vigencia_fim?: string | null;
}

export interface RhTabelaProgressivaFormData extends RhTabelaProgressivaCreateRequest {
  faixas: RhFaixaEncargo[];
}

export interface RhBeneficio {
  id: string;
  nome: string;
  status?: string | null;
  descricao?: string | null;
}

export interface RhBeneficioCreateRequest {
  nome: string;
  descricao?: string | null;
  status?: string | null;
}

export type RhBeneficioUpdateRequest = Partial<RhBeneficioCreateRequest>;

export type RhBeneficiosResponse = PaginatedResponse<RhBeneficio>;
