import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { rhService } from "@/services/rh.service";
import { getApiErrorMessage } from "@/lib/utils";
import { funcionarioSchema } from "@/lib/schemas/rh.schemas";
import { buildDefaultSchedule, extractTurnos, type ScheduleRow } from "@/components/features/rh/rh-utils";
import { RhScheduleEditor } from "../../shared/components/RhScheduleEditor";
import { RhStatusBadge } from "../../shared/components/RhStatusBadge";
import { rhQueryKeys } from "../../shared/utils/queryKeys";
import { formatRhCurrency } from "../../shared/utils/formatters";
import { rhPaths } from "../../shared/utils/paths";

type WizardValues = {
  nome: string;
  cpf: string;
  cargo: string;
  salario_base: string;
  data_admissao: string;
  user_id: string;
};

const steps = [
  "Dados pessoais",
  "Dados contratuais",
  "Salario",
  "Jornada",
  "Beneficios",
  "Revisao",
] as const;

const initialValues: WizardValues = {
  nome: "",
  cpf: "",
  cargo: "",
  salario_base: "",
  data_admissao: "",
  user_id: "",
};

function validateStep(step: number, values: WizardValues, schedule: ScheduleRow[]) {
  const parsed = funcionarioSchema.safeParse({
    ...values,
    user_id: values.user_id.trim() || null,
  });

  if (step === 0 && (!values.nome.trim() || values.cpf.replace(/\D/g, "").length < 11)) {
    return "Informe nome e CPF valido para continuar.";
  }
  if (step === 1 && (!values.cargo.trim() || !values.data_admissao)) {
    return "Informe cargo e data de admissao.";
  }
  if (step === 2 && (!values.salario_base || !Number.isFinite(Number(values.salario_base)) || Number(values.salario_base) < 0)) {
    return "Informe um salario base valido.";
  }
  if (step === 3 && extractTurnos(schedule).length === 0) {
    return "Selecione pelo menos um dia de jornada.";
  }
  if (step === 5 && !parsed.success) {
    return parsed.error.issues[0]?.message ?? "Revise os dados antes de criar o funcionario.";
  }
  return null;
}

export function FuncionarioWizard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<WizardValues>(initialValues);
  const [schedule, setSchedule] = useState<ScheduleRow[]>(buildDefaultSchedule);
  const [error, setError] = useState<string | null>(null);

  const turnos = useMemo(() => extractTurnos(schedule), [schedule]);

  const createMutation = useMutation({
    mutationFn: () => {
      const validationError = validateStep(5, values, schedule);
      if (validationError) {
        throw new Error(validationError);
      }

      return rhService.create({
        nome: values.nome.trim(),
        cpf: values.cpf.trim(),
        cargo: values.cargo.trim(),
        salario_base: values.salario_base,
        data_admissao: values.data_admissao,
        user_id: values.user_id.trim() || null,
        horario_trabalho: { turnos },
      });
    },
    onSuccess: (funcionario) => {
      queryClient.invalidateQueries({ queryKey: rhQueryKeys.funcionarios.all() });
      toast.success("Funcionario criado com sucesso.");
      navigate(rhPaths.funcionarioDetail(funcionario.id));
    },
    onError: (mutationError) =>
      toast.error(
        mutationError instanceof Error && !("response" in mutationError)
          ? mutationError.message
          : getApiErrorMessage(mutationError)
      ),
  });

  const updateValue = (field: keyof WizardValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const goNext = () => {
    const validationError = validateStep(step, values, schedule);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const goBack = () => {
    setError(null);
    setStep((current) => Math.max(current - 1, 0));
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Cadastro guiado</CardTitle>
        <CardDescription>Preencha uma etapa por vez. A revisao final mostra exatamente o que sera enviado ao backend.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid gap-2 md:grid-cols-6">
          {steps.map((label, index) => (
            <div key={label} className="flex items-center gap-2 rounded-md border p-2">
              <Badge variant={index === step ? "default" : index < step ? "success" : "secondary"}>
                {index < step ? <Check className="size-3" /> : index + 1}
              </Badge>
              <span className="text-xs font-medium">{label}</span>
            </div>
          ))}
        </div>

        {error ? <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div> : null}

        {step === 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nome">
              <Input value={values.nome} onChange={(event) => updateValue("nome", event.target.value)} />
            </Field>
            <Field label="CPF">
              <Input value={values.cpf} onChange={(event) => updateValue("cpf", event.target.value)} />
            </Field>
            <Field label="Usuario vinculado" description="Opcional. Use o ID do usuario enquanto a busca remota nao e extraida para esta nova tela.">
              <Input value={values.user_id} onChange={(event) => updateValue("user_id", event.target.value)} placeholder="UUID do usuario" />
            </Field>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Cargo">
              <Input value={values.cargo} onChange={(event) => updateValue("cargo", event.target.value)} />
            </Field>
            <Field label="Data de admissao">
              <Input type="date" value={values.data_admissao} onChange={(event) => updateValue("data_admissao", event.target.value)} />
            </Field>
            <div className="rounded-md border p-3">
              <p className="text-sm font-medium">Status inicial</p>
              <div className="mt-2">
                <RhStatusBadge status="ativo" />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">O backend cria funcionarios ativos por padrao.</p>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Salario base">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={values.salario_base}
                onChange={(event) => updateValue("salario_base", event.target.value)}
              />
            </Field>
            <div className="rounded-md border p-3">
              <p className="text-sm font-medium">Previa</p>
              <p className="mt-1 text-xl font-semibold">{formatRhCurrency(values.salario_base || 0)}</p>
              <p className="mt-1 text-xs text-muted-foreground">Alteracoes futuras de salario devem registrar motivo quando editadas.</p>
            </div>
          </div>
        ) : null}

        {step === 3 ? <RhScheduleEditor schedule={schedule} onChange={setSchedule} /> : null}

        {step === 4 ? (
          <div className="rounded-lg border border-dashed p-5">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 size-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Beneficios aplicaveis</p>
                <p className="text-sm text-muted-foreground">
                  TODO(RH Fase 6): conectar esta etapa aos endpoints de beneficios/regras quando o backend expuser a aplicabilidade por funcionario.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <ReviewCard title="Dados pessoais" items={[["Nome", values.nome], ["CPF", values.cpf], ["Usuario", values.user_id || "Sem vinculo"]]} />
            <ReviewCard title="Contrato" items={[["Cargo", values.cargo], ["Admissao", values.data_admissao], ["Status", "Ativo"]]} />
            <ReviewCard title="Salario" items={[["Salario base", formatRhCurrency(values.salario_base || 0)]]} />
            <ReviewCard title="Jornada" items={[["Dias ativos", `${turnos.length}`]]} />
          </div>
        ) : null}

        <div className="flex items-center justify-between border-t pt-4">
          <Button variant="outline" onClick={goBack} disabled={step === 0 || createMutation.isPending}>
            <ArrowLeft className="size-4" />
            Voltar
          </Button>
          {step < steps.length - 1 ? (
            <Button onClick={goNext}>
              Avancar
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button
              onClick={() => {
                const validationError = validateStep(step, values, schedule);
                if (validationError) {
                  setError(validationError);
                  return;
                }
                setError(null);
                createMutation.mutate();
              }}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Criando..." : "Criar funcionario"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {description ? <span className="text-xs text-muted-foreground">{description}</span> : null}
    </label>
  );
}

function ReviewCard({ title, items }: { title: string; items: Array<[string, string]> }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="font-medium">{title}</p>
      <dl className="mt-3 flex flex-col gap-2">
        {items.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 text-sm">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-right font-medium">{value || "Nao informado"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
