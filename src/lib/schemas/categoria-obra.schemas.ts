import { z } from "zod";

export const categoriaObraSchema = z.object({
  title: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  descricao: z.string().optional(),
  cor: z.string().optional(),
});

export type CategoriaObraFormValues = z.infer<typeof categoriaObraSchema>;
