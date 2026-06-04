import { z } from "zod";
import { HUMAN_MONEY_ERROR, parseHumanCurrencyToDecimalString } from "@/lib/money-input";

const moneyValue = z.string().min(1, "Valor e obrigatorio").transform((value, ctx) => {
  try {
    return parseHumanCurrencyToDecimalString(value);
  } catch {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: HUMAN_MONEY_ERROR });
    return z.NEVER;
  }
});

export const movimentacaoSchema = z.object({
  title: z.string().min(3, "Titulo e obrigatorio"),
  type: z.enum(["entrada", "saida"]),
  valor: moneyValue,
  classe: z.enum(["diarista", "servico", "contrato", "material", "fixo", "operacional"]),
  obra_id: z.string().optional(),
});

export const pagamentoSchema = z.object({
  title: z.string().min(3, "Titulo e obrigatorio"),
  details: z.string().optional(),
  valor: moneyValue,
  classe: z.enum(["diarista", "servico", "contrato", "material", "fixo", "operacional"]),
  data_agendada: z.string().min(1, "Data e obrigatoria"),
  payment_cod: z.string().optional(),
  obra_id: z.string().optional(),
});

export const obraPagamentoSchema = z.object({
  title: z.string().min(3, "Titulo e obrigatorio"),
  details: z.string().min(3, "Detalhes sao obrigatorios"),
  valor: moneyValue,
  data_agendada: z.string().min(1, "Data e obrigatoria"),
  payment_cod: z.string().min(3, "Codigo PIX e obrigatorio"),
});

export type MovimentacaoFormValues = z.infer<typeof movimentacaoSchema>;
export type PagamentoFormValues = z.infer<typeof pagamentoSchema>;
export type ObraPagamentoFormValues = z.infer<typeof obraPagamentoSchema>;
