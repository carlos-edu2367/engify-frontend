import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Building2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  recoveryStep1Schema,
  recoveryStep2Schema,
  recoveryStep3Schema,
  type RecoveryStep1Values,
  type RecoveryStep2Values,
  type RecoveryStep3Values,
} from "@/lib/schemas/auth.schemas";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getApiErrorMessage } from "@/lib/utils";

type Step = 1 | 2 | 3;

export function RecoveryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<Step>(1);
  const [userId, setUserId] = useState(searchParams.get("uid") ?? "");
  const [recoveryCode, setRecoveryCode] = useState("");

  const step1 = useForm<RecoveryStep1Values>({ resolver: zodResolver(recoveryStep1Schema) });
  const step2 = useForm<RecoveryStep2Values>({ resolver: zodResolver(recoveryStep2Schema) });
  const step3 = useForm<RecoveryStep3Values>({ resolver: zodResolver(recoveryStep3Schema) });

  async function onStep1(values: RecoveryStep1Values) {
    try {
      await authService.recovery({ email: values.email || undefined });
      toast.info("Se o usuário existir, um código foi enviado para o email.");
      setStep(2);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  async function onStep2(values: RecoveryStep2Values) {
    if (!userId) {
      toast.error("ID do usuário não encontrado. Certifique-se de usar o link enviado por email.");
      return;
    }
    try {
      await authService.recoveryVerify({ user_id: userId, code: values.code });
      setRecoveryCode(values.code);
      setStep(3);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  async function onStep3(values: RecoveryStep3Values) {
    try {
      await authService.recoveryReset({
        user_id: userId,
        code: recoveryCode,
        new_password: values.new_password,
      });
      toast.success("Senha alterada com sucesso!");
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Building2 className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">Engify</span>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle>Recuperar senha</CardTitle>
                  <CardDescription>Informe seu email para receber o código</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={step1.handleSubmit(onStep1)} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="seu@email.com" {...step1.register("email")} />
                    </div>
                    {userId === "" && (
                      <div className="space-y-1.5">
                        <Label htmlFor="uid">Seu ID de usuário (se souber)</Label>
                        <Input
                          id="uid"
                          placeholder="UUID (opcional)"
                          value={userId}
                          onChange={(e) => setUserId(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          O ID virá no link do email de recuperação.
                        </p>
                      </div>
                    )}
                    <Button type="submit" className="w-full" disabled={step1.formState.isSubmitting}>
                      {step1.formState.isSubmitting ? "Enviando..." : "Enviar código"}
                    </Button>
                    <p className="text-center text-sm">
                      <Link to="/login" className="text-muted-foreground hover:text-foreground">
                        Voltar ao login
                      </Link>
                    </p>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle>Inserir código</CardTitle>
                  <CardDescription>Verifique seu email e cole o código recebido</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={step2.handleSubmit(onStep2)} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="code">Código</Label>
                      <Input id="code" placeholder="Cole o código aqui" {...step2.register("code")} />
                      {step2.formState.errors.code && (
                        <p className="text-xs text-destructive">{step2.formState.errors.code.message}</p>
                      )}
                    </div>
                    <Button type="submit" className="w-full" disabled={step2.formState.isSubmitting}>
                      {step2.formState.isSubmitting ? "Verificando..." : "Verificar código"}
                    </Button>
                    <button type="button" className="w-full text-sm text-muted-foreground hover:text-foreground" onClick={() => setStep(1)}>
                      Voltar
                    </button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle>Nova senha</CardTitle>
                  <CardDescription>Escolha uma nova senha para sua conta</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={step3.handleSubmit(onStep3)} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="new_password">Nova senha</Label>
                      <Input id="new_password" type="password" placeholder="Mínimo 6 caracteres" {...step3.register("new_password")} />
                      {step3.formState.errors.new_password && (
                        <p className="text-xs text-destructive">{step3.formState.errors.new_password.message}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="confirm_password">Confirmar senha</Label>
                      <Input id="confirm_password" type="password" placeholder="Repita a senha" {...step3.register("confirm_password")} />
                      {step3.formState.errors.confirm_password && (
                        <p className="text-xs text-destructive">{step3.formState.errors.confirm_password.message}</p>
                      )}
                    </div>
                    <Button type="submit" className="w-full" disabled={step3.formState.isSubmitting}>
                      {step3.formState.isSubmitting ? "Alterando..." : "Alterar senha"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
