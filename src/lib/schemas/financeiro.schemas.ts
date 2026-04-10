import { z } from "zod";

export const movimentacaoSchema = z.object({
  title: z.string().min(3, "Título é obrigatório"),
  type: z.enum(["entrada", "saida"]),
  valor: z.string().min(1, "Valor é obrigatório"),
  classe: z.enum(["diarista", "servico", "contrato", "material", "fixo", "operacional"]),
  obra_id: z.string().optional(),
});

export const pagamentoSchema = z.object({
  title: z.string().min(3, "Título é obrigatório"),
  details: z.string().optional(),
  valor: z.string().min(1, "Valor é obrigatório"),
  classe: z.enum(["diarista", "servico", "contrato", "material", "fixo", "operacional"]),
  data_agendada: z.string().optional(),
  payment_cod: z.string().optional(),
  obra_id: z.string().optional(),
});

export const obraPagamentoSchema = z.object({
  title: z.string().min(3, "Título é obrigatório"),
  details: z.string().min(3, "Detalhes são obrigatórios"),
  valor: z.string().min(1, "Valor é obrigatório"),
  data_agendada: z.string().min(1, "Data é obrigatória"),
  payment_cod: z.string().min(3, "Código PIX é obrigatório"),
});

export type MovimentacaoFormValues = z.infer<typeof movimentacaoSchema>;
export type PagamentoFormValues = z.infer<typeof pagamentoSchema>;
export type ObraPagamentoFormValues = z.infer<typeof obraPagamentoSchema>;
