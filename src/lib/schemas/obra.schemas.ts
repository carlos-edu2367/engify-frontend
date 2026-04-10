import { z } from "zod";

export const obraSchema = z.object({
  title: z.string().min(3, "Título deve ter ao menos 3 caracteres"),
  responsavel_id: z.string().uuid("Selecione um responsável"),
  description: z.string().optional(),
  valor: z.coerce.number().positive("Valor deve ser positivo").optional(),
  data_entrega: z.string().optional().transform((v) => v === "" ? undefined : v),
  categoria_id: z.string().uuid().nullable().optional(),
});

export const itemSchema = z.object({
  title: z.string().min(3, "Título deve ter ao menos 3 caracteres"),
  descricao: z.string().optional(),
  responsavel_id: z.string().optional(),
});

export type ObraFormValues = z.infer<typeof obraSchema>;
export type ItemFormValues = z.infer<typeof itemSchema>;
