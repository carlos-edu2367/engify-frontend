import { useSearchParams, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Building2, Eye, EyeOff, LinkIcon } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { IMaskInput } from "react-imask";
import { registerInviteSchema, type RegisterInviteFormValues } from "@/lib/schemas/auth.schemas";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getApiErrorMessage } from "@/lib/utils";

export function RegisterInvitePage() {
  const [searchParams] = useSearchParams();
  const inviteId = searchParams.get("invite");
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInviteFormValues>({
    resolver: zodResolver(registerInviteSchema),
  });

  async function onSubmit(values: RegisterInviteFormValues) {
    try {
      await authService.register({
        nome: values.nome,
        cpf: values.cpf.replace(/\D/g, ""),
        senha: values.senha,
        solicitacao_id: inviteId!,
      });
      toast.success("Conta criada com sucesso! Faça login para continuar.");
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  if (!inviteId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm"
        >
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-muted p-4">
              <LinkIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-2">Link de convite inválido</h2>
          <p className="text-sm text-muted-foreground">
            Este link não contém um convite válido. Solicite um novo convite ao administrador do
            time.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm"
      >
        <div className="flex items-center justify-center gap-2 mb-8">
          <Building2 className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">Engify</span>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Criar sua conta</CardTitle>
            <CardDescription>Você foi convidado para entrar no Engify</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="nome">Nome completo</Label>
                <Input id="nome" placeholder="Seu nome" {...register("nome")} />
                {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cpf">CPF</Label>
                <Controller
                  name="cpf"
                  control={control}
                  render={({ field }) => (
                    <IMaskInput
                      mask="000.000.000-00"
                      unmask={false}
                      onAccept={(value) => field.onChange(value)}
                      placeholder="000.000.000-00"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  )}
                />
                {errors.cpf && <p className="text-xs text-destructive">{errors.cpf.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="senha">Senha</Label>
                <div className="relative">
                  <Input
                    id="senha"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    {...register("senha")}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword((p) => !p)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.senha && <p className="text-xs text-destructive">{errors.senha.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmar_senha">Confirmar senha</Label>
                <Input
                  id="confirmar_senha"
                  type="password"
                  placeholder="Repita a senha"
                  {...register("confirmar_senha")}
                />
                {errors.confirmar_senha && (
                  <p className="text-xs text-destructive">{errors.confirmar_senha.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Criando conta..." : "Criar conta"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
