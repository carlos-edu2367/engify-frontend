import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  cpf: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .optional(),
  senha: z.string().min(1, "Senha é obrigatória"),
});

export const registerInviteSchema = z
  .object({
    nome: z.string().min(3, "Nome deve ter ao menos 3 caracteres"),
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

// Step 1: solicitar link de recuperação por email
export const recoveryStep1Schema = z.object({
  email: z.string().email("Email inválido"),
});

// Step 2: definir nova senha (chegou pelo link do email com uid + token)
export const recoveryResetSchema = z
  .object({
    new_password: z
      .string()
      .min(6, "Senha deve ter ao menos 6 caracteres"),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "As senhas não coincidem",
    path: ["confirm_password"],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterInviteFormValues = z.infer<typeof registerInviteSchema>;
export type RecoveryStep1Values = z.infer<typeof recoveryStep1Schema>;
export type RecoveryResetValues = z.infer<typeof recoveryResetSchema>;
