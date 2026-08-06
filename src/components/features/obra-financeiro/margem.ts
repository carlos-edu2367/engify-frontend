export type EstadoMargem = "saudavel" | "apertada" | "prejuizo" | "indefinida";

/** Limiares iniciais assumidos, não validados como regra de negócio. Ajuste aqui. */
export const MARGEM_SAUDAVEL_PCT = 10;
export const MARGEM_APERTADA_PCT = 0;

export const ESTADO_MARGEM_CLASSES: Record<EstadoMargem, string> = {
  saudavel: "text-emerald-600 dark:text-emerald-400",
  apertada: "text-amber-600 dark:text-amber-400",
  prejuizo: "text-destructive",
  indefinida: "text-muted-foreground",
};

/**
 * Determina o estado de saude da margem projetada.
 *
 * Margem negativa sempre indica prejuizo, mesmo sem percentual calculavel
 * (contrato zero) — uma obra sangrando dinheiro deve alertar independente
 * de ter ou nao um valor de contrato definido.
 */
export function getEstadoMargem(
  margem: string | null,
  pct: string | null,
): EstadoMargem {
  if (margem === null) return "indefinida";

  const margemNum = Number(margem);
  if (margemNum < 0) return "prejuizo";

  if (pct === null) return "indefinida";

  const pctNum = Number(pct);
  if (pctNum >= MARGEM_SAUDAVEL_PCT) return "saudavel";
  return "apertada";
}
