export interface ScreenContext {
  route: string;
  path: string;
  title: string;
  module: string;
}

export interface SelectionContext {
  entity_type: string;
  entity_id?: string | null;
}

export interface UIState {
  filters?: Record<string, unknown> | null;
  visible_tab?: string | null;
}

export interface ArkyChatRequest {
  message: string;
  screen?: ScreenContext | null;
  selection?: SelectionContext | null;
  ui_state?: UIState | null;
  conversation_id?: string | null;
  intent_hint?: string | null;
  screenshot?: string | null;
}

export interface ArkyPagamentoPreviewItem {
  title: string;
  valor: number;
  classe: string;
  data_agendada?: string | null;
  tem_codigo_pagamento?: boolean;
  obra_title?: string | null;
  diarist_nome?: string | null;
}

export interface ArkyCardData {
  total?: number;
  quantidade?: number;
  itens?: ArkyPagamentoPreviewItem[];
  // Outras ações preparadas podem trazer pares chave/valor arbitrários.
  [key: string]: unknown;
}

export interface ArkyCardResponse {
  type: string;
  title: string;
  summary: string;
  risk: string;
  requires_confirmation: boolean;
  action_preview_id?: string | null;
  // Detalhes estruturados da ação preparada (ex.: itens de pagamento).
  data?: ArkyCardData | null;
}

export interface ArkyActionResponse {
  type: string;
  label: string;
  action_preview_id?: string | null;
  to?: string | null;
}

export interface ArkyChatResponse {
  conversation_id: string;
  message_id: string;
  message: string;
  intent: string;
  cards: ArkyCardResponse[];
  actions: ArkyActionResponse[];
  citations: Record<string, unknown>[];
}

export type ArkyStreamEventType =
  | "status"
  | "tool_start"
  | "tool_end"
  | "tool_error"
  | "final";

export type ArkyStreamStatus =
  | "recebendo_mensagem"
  | "buscando_contexto"
  | "consultando_documentacao"
  | "chamando_tool"
  | "tool_concluida"
  | "tool_bloqueada"
  | "tool_erro"
  | "processando_resposta"
  | "finalizado"
  | "erro"
  | "capturando_screenshot"
  | "screenshot_anexado"
  | "screenshot_indisponivel";

export interface ArkyStreamEvent {
  type: ArkyStreamEventType;
  status: ArkyStreamStatus | string;
  label: string;
  tool_name?: string | null;
  summary?: string | null;
  data?: ArkyChatResponse;
}

export interface ArkyConfirmResponse {
  action_preview_id: string;
  status: "confirmed" | "rejected" | "expired";
  message: string;
  // Resultado da execucao da acao confirmada (ex.: pagamentos criados).
  // Ausente em acoes preview-only.
  result?: {
    created?: number;
    total?: number;
    pagamento_ids?: string[];
  } | null;
}

export type MessageRole = "user" | "assistant";

export interface ArkyMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  cards?: ArkyCardResponse[];
  actions?: ArkyActionResponse[];
  citations?: Record<string, unknown>[];
  events?: ArkyStreamEvent[];
}

export type RiskLevel =
  | "leitura"
  | "sugestao"
  | "preparacao"
  | "escrita_sensivel"
  | "bloqueado";
