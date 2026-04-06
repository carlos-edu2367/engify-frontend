export interface DiariesResponse {
  id: string;
  diarist_id: string;
  diarist_name: string;
  descricao_diaria?: string;
  obra_id: string;
  obra_title: string;
  quantidade: number;
  data: string;
}

export interface CreateDiariaRequest {
  diarista_id: string;
  obra_id: string;
  descricao_diaria?: string;
  quantidade_diaria?: number;
  data?: string;
  data_pagamento?: string;
}

export interface UpdateDiariaRequest {
  descricao_diaria?: string;
  quantidade_diaria?: number;
  data?: string;
}
