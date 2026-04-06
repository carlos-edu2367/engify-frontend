import type { ObraImageResponse } from "./attachment.types";

export type ObraStatus = "planejamento" | "em_andamento" | "finalizado";

export interface ObraResponse {
  id: string;
  title: string;
  description?: string;
  responsavel_id: string;
  team_id?: string;
  status: ObraStatus;
  valor?: string;
  data_entrega?: string;
  created_date: string;
}

export interface CreateObraRequest {
  title: string;
  responsavel_id: string;
  description?: string;
  valor?: number;
  data_entrega?: string;
}

export interface UpdateObraRequest {
  title?: string;
  responsavel_id?: string;
  description?: string;
  valor?: number;
  data_entrega?: string;
}

export interface UpdateObraStatusRequest {
  status: ObraStatus;
}

export interface ObraClienteItemResponse {
  id: string;
  title: string;
  status: "planejamento" | "em_andamento" | "finalizado";
}

export interface ObraClienteResponse {
  id: string;
  title: string;
  description?: string;
  status: ObraStatus;
  data_entrega?: string;
  items: ObraClienteItemResponse[];
  images: ObraImageResponse[];
}
