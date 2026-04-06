export type ItemStatus = "planejamento" | "em_andamento" | "finalizado";

export interface ItemResponse {
  id: string;
  title: string;
  descricao?: string;
  responsavel_id?: string;
  status: ItemStatus;
  obra_id: string;
}

export interface CreateItemRequest {
  title: string;
  descricao?: string;
  responsavel_id?: string;
}

export interface UpdateItemRequest {
  title?: string;
  descricao?: string;
  responsavel_id?: string;
  status?: ItemStatus;
}
