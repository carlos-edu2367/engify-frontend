import { addMonths, format, parseISO } from "date-fns";

export const MIN_PARCELAS = 2;
export const MAX_PARCELAS = 36;

export interface ParcelaPreview {
  numero: number;
  /** Valor em string decimal, ex: "333.33". */
  valor: string;
  /** Vencimento em "yyyy-MM-dd". */
  data: string;
}

/**
 * Espelha o rateio do backend: as parcelas 1..N-1 recebem o valor base
 * arredondado para baixo, a ultima absorve o residuo. Contas feitas em
 * centavos inteiros para nao depender de aritmetica de ponto flutuante.
 */
export function buildParcelasPreview(
  valorDecimal: string,
  parcelas: number,
  primeiraDataISO: string,
): ParcelaPreview[] {
  if (!Number.isInteger(parcelas) || parcelas < MIN_PARCELAS || parcelas > MAX_PARCELAS) {
    return [];
  }
  const totalCentavos = Math.round(Number(valorDecimal) * 100);
  if (!Number.isFinite(totalCentavos) || totalCentavos <= 0) return [];
  if (!primeiraDataISO) return [];

  const base = Math.floor(totalCentavos / parcelas);
  const primeira = parseISO(primeiraDataISO);

  return Array.from({ length: parcelas }, (_, i) => {
    const centavos = i === parcelas - 1 ? totalCentavos - base * (parcelas - 1) : base;
    return {
      numero: i + 1,
      valor: (centavos / 100).toFixed(2),
      // date-fns addMonths ja faz clamp para o ultimo dia do mes de destino
      data: format(addMonths(primeira, i), "yyyy-MM-dd"),
    };
  });
}
