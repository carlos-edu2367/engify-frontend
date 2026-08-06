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

const parcelasField = z.coerce
  .number()
  .int("Informe um numero inteiro de parcelas")
  .min(1, "Minimo 1")
  .max(36, "Maximo 36 parcelas")
  .default(1);

export const pagamentoSchema = z.object({
  title: z.string().min(3, "Titulo e obrigatorio"),
  details: z.string().optional(),
  valor: moneyValue,
  classe: z.enum(["diarista", "servico", "contrato", "material", "fixo", "operacional"]),
  data_agendada: z.string().min(1, "Data e obrigatoria"),
  payment_cod: z.string().optional(),
  obra_id: z.string().nullish(),
  parcelas: parcelasField,
  payment_cods: z.array(z.string().nullish()).optional(),
  requires_receipt: z.boolean().default(false),
});

export const obraPagamentoSchema = z
  .object({
    title: z.string().min(3, "Titulo e obrigatorio"),
    details: z.string().min(3, "Detalhes sao obrigatorios"),
    valor: moneyValue,
    data_agendada: z.string().min(1, "Data e obrigatoria"),
    payment_cod: z.string().optional(),
    parcelas: parcelasField,
    payment_cods: z.array(z.string().nullish()).optional(),
    requires_receipt: z.boolean().default(false),
  })
  .refine((v) => (v.payment_cod ?? "").trim().length >= 3, {
    message: "Codigo PIX e obrigatorio",
    path: ["payment_cod"],
  });

export const registrarSaidaSchema = movimentacaoSchema.pick({
  title: true,
  valor: true,
  classe: true,
});

export type MovimentacaoFormValues = z.infer<typeof movimentacaoSchema>;
export type RegistrarSaidaFormValues = z.infer<typeof registrarSaidaSchema>;
export type PagamentoFormValues = z.infer<typeof pagamentoSchema>;
export type ObraPagamentoFormValues = z.infer<typeof obraPagamentoSchema>;
