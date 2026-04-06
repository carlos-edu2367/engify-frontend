import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Building2 } from "lucide-react";
import { motion } from "framer-motion";
import { IMaskInput } from "react-imask";
import { createTeamSchema, type CreateTeamFormValues } from "@/lib/schemas/team.schemas";
import { teamsService } from "@/services/teams.service";
import { useOnboardingStore } from "@/store/onboarding.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getApiErrorMessage } from "@/lib/utils";

export function RegisterTeamPage() {
  const navigate = useNavigate();
  const { setKey } = useOnboardingStore();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateTeamFormValues>({
    resolver: zodResolver(createTeamSchema),
  });

  async function onSubmit(values: CreateTeamFormValues) {
    try {
      const data = await teamsService.create(values);
      setKey(data.key, data.cnpj);
      navigate("/register/admin");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
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

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</div>
          <div className="flex-1 h-px bg-border" />
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-bold">2</div>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Criar sua empresa</CardTitle>
            <CardDescription>Informe os dados da sua construtora ou empresa</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Nome da empresa</Label>
                <Input
                  id="title"
                  placeholder="Construtora Silva"
                  {...register("title")}
                />
                {errors.title && (
                  <p className="text-xs text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Controller
                  name="cnpj"
                  control={control}
                  render={({ field }) => (
                    <IMaskInput
                      mask="00.000.000/0000-00"
                      unmask={false}
                      onAccept={(value) => field.onChange(value)}
                      placeholder="00.000.000/0000-00"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  )}
                />
                {errors.cnpj && (
                  <p className="text-xs text-destructive">{errors.cnpj.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Criando..." : "Continuar"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Já tem uma conta?{" "}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Entrar
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
