import { z } from "zod";

export const diariaSchema = z.object({
  diarista_id: z.string().uuid("Selecione um diarista"),
  obra_id: z.string().uuid("Selecione uma obra").optional(),
  descricao_diaria: z.string().optional(),
  quantidade_diaria: z.coerce.number().min(0.5).default(1),
  data: z.string().optional(),
  data_pagamento: z.string().optional(),
});

export type DiariaFormValues = z.infer<typeof diariaSchema>;
