import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Building2, Mail, CheckCircle2, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  recoveryStep1Schema,
  recoveryResetSchema,
  type RecoveryStep1Values,
  type RecoveryResetValues,
} from "@/lib/schemas/auth.schemas";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getApiErrorMessage } from "@/lib/utils";

// ─── Tipos de estado da página ───────────────────────────────────────────────

type PageMode =
  | { kind: "request" }                          // formulário de email
  | { kind: "email-sent" }                       // aguardando link no email
  | { kind: "reset"; uid: string; token: string } // form de nova senha (veio pelo link)
  | { kind: "invalid-link" };                    // link mal-formado

// ─── Animação ────────────────────────────────────────────────────────────────

const slide = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -24 },
  transition: { duration: 0.2 },
};

// ─── Componente ──────────────────────────────────────────────────────────────

export function RecoveryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<PageMode>({ kind: "request" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Guarda uid+token em ref (não em estado) para não reexportar na URL
  const resetCredentials = useRef<{ uid: string; token: string } | null>(null);

  // ── Detecta params do link de recuperação ──────────────────────────────────
  useEffect(() => {
    const uid   = searchParams.get("uid");
    const token = searchParams.get("token");

    if (!uid && !token) return; // acesso direto sem params — fluxo normal

    if (!uid || !token) {
      // Link incompleto: um param presente mas não o outro
      setMode({ kind: "invalid-link" });
      return;
    }

    // Armazena credenciais em ref e limpa a URL para não ficar visível no histórico
    resetCredentials.current = { uid, token };
    window.history.replaceState({}, "", "/recovery");

    setMode({ kind: "reset", uid, token });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Formulários ───────────────────────────────────────────────────────────

  const step1Form = useForm<RecoveryStep1Values>({
    resolver: zodResolver(recoveryStep1Schema),
  });

  const resetForm = useForm<RecoveryResetValues>({
    resolver: zodResolver(recoveryResetSchema),
  });

  // ── Handlers ─────────────────────────────────────────────────────────────

  async function onRequestRecovery(values: RecoveryStep1Values) {
    try {
      await authService.recovery({ email: values.email });
      setMode({ kind: "email-sent" });
    } catch {
      // Não revelar se o email existe — sempre avançar
      setMode({ kind: "email-sent" });
    }
  }

  async function onResetPassword(values: RecoveryResetValues) {
    const creds = resetCredentials.current;
    if (!creds) {
      toast.error("Credenciais de recuperação ausentes. Solicite um novo link.");
      setMode({ kind: "request" });
      return;
    }

    try {
      await authService.recoveryReset({
        user_id: creds.uid,
        code: creds.token,
        new_password: values.new_password,
      });
      // Limpa referência imediatamente após uso
      resetCredentials.current = null;
      toast.success("Senha alterada com sucesso!");
      navigate("/login", { replace: true });
    } catch (err) {
      const message = getApiErrorMessage(err);
      toast.error(message);

      // Link expirado ou já usado — orientar usuário a solicitar novo
      if (message.toLowerCase().includes("expir") || message.toLowerCase().includes("inválid")) {
        resetCredentials.current = null;
        setMode({ kind: "invalid-link" });
      }
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Building2 className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">Engify</span>
        </div>

        <AnimatePresence mode="wait">

          {/* ── Step 1: solicitar link ── */}
          {mode.kind === "request" && (
            <motion.div key="request" {...slide}>
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle>Recuperar senha</CardTitle>
                  <CardDescription>
                    Informe seu email e enviaremos um link para redefinir a senha.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={step1Form.handleSubmit(onRequestRecovery)}
                    className="space-y-4"
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        autoComplete="email"
                        {...step1Form.register("email")}
                      />
                      {step1Form.formState.errors.email && (
                        <p className="text-xs text-destructive">
                          {step1Form.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={step1Form.formState.isSubmitting}
                    >
                      {step1Form.formState.isSubmitting ? "Enviando..." : "Enviar link de recuperação"}
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

          {/* ── Step 1 concluído: aguardar email ── */}
          {mode.kind === "email-sent" && (
            <motion.div key="email-sent" {...slide}>
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex justify-center mb-3">
                    <Mail className="h-10 w-10 text-primary" />
                  </div>
                  <CardTitle className="text-center">Verifique seu email</CardTitle>
                  <CardDescription className="text-center">
                    Se o endereço informado estiver cadastrado, você receberá um link
                    em instantes. O link expira em <strong>30 minutos</strong>.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground text-center">
                    Não recebeu? Verifique a pasta de spam ou{" "}
                    <button
                      type="button"
                      className="underline hover:text-foreground"
                      onClick={() => setMode({ kind: "request" })}
                    >
                      tente novamente
                    </button>
                    .
                  </p>
                  <p className="text-center text-sm">
                    <Link to="/login" className="text-muted-foreground hover:text-foreground">
                      Voltar ao login
                    </Link>
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── Step 2: redefinir senha (veio pelo link) ── */}
          {mode.kind === "reset" && (
            <motion.div key="reset" {...slide}>
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex justify-center mb-3">
                    <CheckCircle2 className="h-10 w-10 text-green-500" />
                  </div>
                  <CardTitle>Criar nova senha</CardTitle>
                  <CardDescription>
                    Escolha uma senha forte para sua conta.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={resetForm.handleSubmit(onResetPassword)}
                    className="space-y-4"
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor="new_password">Nova senha</Label>
                      <div className="relative">
                        <Input
                          id="new_password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Mínimo 6 caracteres"
                          autoComplete="new-password"
                          className="pr-10"
                          {...resetForm.register("new_password")}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowPassword((v) => !v)}
                          tabIndex={-1}
                          aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {resetForm.formState.errors.new_password && (
                        <p className="text-xs text-destructive">
                          {resetForm.formState.errors.new_password.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="confirm_password">Confirmar senha</Label>
                      <div className="relative">
                        <Input
                          id="confirm_password"
                          type={showConfirm ? "text" : "password"}
                          placeholder="Repita a nova senha"
                          autoComplete="new-password"
                          className="pr-10"
                          {...resetForm.register("confirm_password")}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowConfirm((v) => !v)}
                          tabIndex={-1}
                          aria-label={showConfirm ? "Ocultar senha" : "Mostrar senha"}
                        >
                          {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {resetForm.formState.errors.confirm_password && (
                        <p className="text-xs text-destructive">
                          {resetForm.formState.errors.confirm_password.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={resetForm.formState.isSubmitting}
                    >
                      {resetForm.formState.isSubmitting ? "Alterando..." : "Alterar senha"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── Link inválido / expirado ── */}
          {mode.kind === "invalid-link" && (
            <motion.div key="invalid-link" {...slide}>
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex justify-center mb-3">
                    <AlertTriangle className="h-10 w-10 text-destructive" />
                  </div>
                  <CardTitle className="text-center">Link inválido ou expirado</CardTitle>
                  <CardDescription className="text-center">
                    Este link de recuperação não é mais válido. Links expiram após
                    30 minutos e só podem ser usados uma vez.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full"
                    onClick={() => setMode({ kind: "request" })}
                  >
                    Solicitar novo link
                  </Button>
                  <p className="text-center text-sm">
                    <Link to="/login" className="text-muted-foreground hover:text-foreground">
                      Voltar ao login
                    </Link>
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
