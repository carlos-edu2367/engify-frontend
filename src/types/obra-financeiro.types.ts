import type { MovClass } from "@/types/financeiro.types";

export interface CustoPorClasse {
  classe: MovClass;
  realizado: string;
  comprometido: string;
}

export interface ObraFinanceiroResumo {
  obra_id: string;
  contrato: string | null;
  entradas: string;
  saidas: string;
  comprometido: string;
  resultado_realizado: string;
  custo_previsto: string;
  margem_projetada: string | null;
  margem_projetada_pct: string | null;
  a_receber: string | null;
  total_recebido_obra: string;
  custos_por_classe: CustoPorClasse[];
  qtd_movimentacoes: number;
  qtd_pagamentos_aguardando: number;
}
