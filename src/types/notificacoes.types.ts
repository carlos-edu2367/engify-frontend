export type NotificacaoTipo = "mencao_mural" | "prazo_7_dias" | "prazo_1_dia";

export interface NotificacaoResponse {
  id: string;
  tipo: NotificacaoTipo;
  titulo: string;
  mensagem: string;
  reference_id: string | null;
  lida: boolean;
  created_at: string;
}

export interface NotificacoesListResponse {
  items: NotificacaoResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface NotificacoesContagemResponse {
  nao_lidas: number;
}
