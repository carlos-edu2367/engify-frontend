import type { RhFaixaEncargo, RhRegraEncargoCreateRequest, RhTabelaProgressivaFormData } from "@/types/rh.types";

export type RegraEncargoPreset = RhRegraEncargoCreateRequest & {
  sourceLabel: string;
};

export type TabelaProgressivaPreset = RhTabelaProgressivaFormData & {
  sourceLabel: string;
};

export const INSS_2026_TETO_SALARIO = "8475.55";
export const INSS_2026_TETO_CONTRIBUICAO = "988.09";

export const inss2026Faixas: RhFaixaEncargo[] = [
  { ordem: 0, valor_inicial: "0", valor_final: "1621.00", aliquota: "7.5", deducao: "0", calculo_marginal: true },
  { ordem: 1, valor_inicial: "1621.01", valor_final: "2902.84", aliquota: "9", deducao: "0", calculo_marginal: true },
  { ordem: 2, valor_inicial: "2902.85", valor_final: "4354.27", aliquota: "12", deducao: "0", calculo_marginal: true },
  { ordem: 3, valor_inicial: "4354.28", valor_final: "", aliquota: "14", deducao: "0", calculo_marginal: true },
];

export const tabelaProgressivaPresets = {
  inss2026: {
    nome: "INSS 2026",
    codigo: "INSS_2026",
    descricao: "Tabela oficial de contribuicao mensal INSS para empregados, domesticos e avulsos, competencia janeiro/2026.",
    vigencia_inicio: "2026-01-01T00:00:00",
    vigencia_fim: null,
    faixas: inss2026Faixas,
    sourceLabel: "INSS - tabela de contribuicao mensal 2026",
  } satisfies TabelaProgressivaPreset,
};

export const regraEncargoPresets = {
  inss: {
    nome: "INSS empregado",
    codigo: "INSS",
    natureza: "desconto",
    tipo_calculo: "tabela_progressiva",
    base_calculo: "salario_base_mais_extras",
    percentual: null,
    valor_fixo: null,
    tabela_progressiva_id: null,
    teto: INSS_2026_TETO_CONTRIBUICAO,
    prioridade: 80,
    vigencia_inicio: "2026-01-01T00:00:00",
    vigencia_fim: null,
    sourceLabel: "INSS - regra progressiva para desconto do segurado",
  } satisfies RegraEncargoPreset,
  fgts: {
    nome: "FGTS mensal",
    codigo: "FGTS",
    natureza: "informativo",
    tipo_calculo: "percentual_simples",
    base_calculo: "salario_base_mais_extras",
    percentual: "8",
    valor_fixo: null,
    tabela_progressiva_id: null,
    prioridade: 120,
    vigencia_inicio: "2026-01-01T00:00:00",
    vigencia_fim: null,
    sourceLabel: "FGTS - deposito mensal geral",
  } satisfies RegraEncargoPreset,
  fgtsAprendiz: {
    nome: "FGTS aprendiz",
    codigo: "FGTS_APRENDIZ",
    natureza: "informativo",
    tipo_calculo: "percentual_simples",
    base_calculo: "salario_base_mais_extras",
    percentual: "2",
    valor_fixo: null,
    tabela_progressiva_id: null,
    prioridade: 121,
    vigencia_inicio: "2026-01-01T00:00:00",
    vigencia_fim: null,
    sourceLabel: "FGTS - aliquota para menor aprendiz",
  } satisfies RegraEncargoPreset,
};
