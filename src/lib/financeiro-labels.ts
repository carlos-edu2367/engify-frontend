import type { MovClass } from "@/types/financeiro.types";

export const classeLabels: Record<MovClass, string> = {
  diarista: "Diarista",
  servico: "Serviço",
  contrato: "Contrato",
  material: "Material",
  fixo: "Fixo",
  operacional: "Operacional",
};
