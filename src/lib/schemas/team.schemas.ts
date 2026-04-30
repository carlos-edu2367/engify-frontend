import { z } from "zod";

export const createTeamSchema = z.object({
  title: z.string().min(3, "Nome deve ter ao menos 3 caracteres"),
  cnpj: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length === 14, "CNPJ deve ter 14 dígitos"),
});

export const createFirstUserSchema = z
  .object({
    nome: z.string().min(3, "Nome deve ter ao menos 3 caracteres"),
    email: z.string().email("Email inválido"),
    cpf: z
      .string()
      .transform((v) => v.replace(/\D/g, ""))
      .refine((v) => v.length === 11, "CPF deve ter 11 dígitos"),
    senha: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
    confirmar_senha: z.string(),
  })
  .refine((d) => d.senha === d.confirmar_senha, {
    message: "As senhas não coincidem",
    path: ["confirmar_senha"],
  });

export const inviteSchema = z.object({
  email: z.string().email("Email inválido"),
  role: z.enum(["admin", "engenheiro", "financeiro", "cliente", "funcionario"]),
});

export const diaristaSchema = z.object({
  nome: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  descricao: z.string().optional(),
  valor_diaria: z.string().min(1, "Valor é obrigatório"),
  chave_pix: z.string().optional(),
});

export const updateTeamSchema = z.object({
  title: z.string().min(3, "Nome deve ter ao menos 3 caracteres"),
});

export type CreateTeamFormValues = z.infer<typeof createTeamSchema>;
export type CreateFirstUserFormValues = z.infer<typeof createFirstUserSchema>;
export type InviteFormValues = z.infer<typeof inviteSchema>;
export type DiaristaFormValues = z.infer<typeof diaristaSchema>;
export type UpdateTeamFormValues = z.infer<typeof updateTeamSchema>;
