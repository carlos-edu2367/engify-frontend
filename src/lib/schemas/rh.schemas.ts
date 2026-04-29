import { z } from "zod";

export const funcionarioSchema = z
  .object({
    nome: z.string().min(1, "Nome obrigatorio"),
    cpf: z.string().min(11, "CPF obrigatorio"),
    cargo: z.string().min(1, "Cargo obrigatorio"),
    salario_base: z.string().min(1, "Salario obrigatorio"),
    data_admissao: z.string().min(1, "Data de admissao obrigatoria"),
    user_id: z.string().optional().nullable(),
    reason: z.string().optional(),
    is_active: z.boolean().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.reason !== undefined && !values.reason.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reason"],
        message: "Informe o motivo da alteracao.",
      });
    }
  });

export type FuncionarioFormValues = z.infer<typeof funcionarioSchema>;
