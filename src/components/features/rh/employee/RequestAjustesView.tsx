import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/utils";
import { rhService } from "@/services/rh.service";
import { EmployeeRequestCard, EmployeeTimeline, Field } from "../rh-shared";
import { buildDateEnd, buildDateStart, combineDateAndTime } from "../rh-utils";
import {
  AJUSTE_HORARIO_OPTIONS,
  getSelectedScheduleFields,
  getWizardError,
  isWizardStepValid,
  type ScheduleField,
} from "./request-ajustes.utils";

interface RequestAjustesViewProps {
  startDate?: string;
  endDate?: string;
}

const steps = [
  { title: "Escolha o dia", description: "Informe o dia em que o ponto precisa ser corrigido." },
  { title: "Escolha o que corrigir", description: "Preencha apenas os horários que estão faltando ou incorretos." },
  { title: "Explique o que aconteceu", description: "Uma explicação curta ajuda o RH a analisar seu pedido." },
] as const;

const fieldLabels: Record<ScheduleField, string> = {
  entrada: "Entrada",
  intervaloInicio: "Saída para intervalo",
  intervaloFim: "Volta do intervalo",
  saida: "Saída",
};

const intervalHelperTitle = "Intervalo: saída e volta juntas";
const intervalHelperDescription = "As duas partes serão solicitadas juntas";

const emptyForm = {
  dataReferencia: "",
  justificativa: "",
  entrada: "",
  saida: "",
  intervaloInicio: "",
  intervaloFim: "",
};

export function RequestAjustesView({ startDate, endDate }: RequestAjustesViewProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedScheduleFields, setSelectedScheduleFields] = useState<ScheduleField[]>([]);
  const [form, setForm] = useState(emptyForm);

  const meusAjustesQuery = useQuery({
    queryKey: ["rh-meus-ajustes", startDate, endDate],
    queryFn: () =>
      rhService.listAjustes({
        page: 1,
        limit: 50,
        start: startDate ? buildDateStart(startDate) : undefined,
        end: endDate ? buildDateEnd(endDate) : undefined,
      }),
  });

  const createAjusteMutation = useMutation({
    mutationFn: () =>
      rhService.createAjuste({
        data_referencia: buildDateStart(form.dataReferencia),
        justificativa: form.justificativa,
        hora_entrada_solicitada: form.entrada
          ? combineDateAndTime(form.dataReferencia, form.entrada)
          : null,
        hora_saida_solicitada: form.saida
          ? combineDateAndTime(form.dataReferencia, form.saida)
          : null,
        hora_intervalo_inicio_solicitada: form.intervaloInicio
          ? combineDateAndTime(form.dataReferencia, form.intervaloInicio)
          : null,
        hora_intervalo_fim_solicitada: form.intervaloFim
          ? combineDateAndTime(form.dataReferencia, form.intervaloFim)
          : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rh-me-resumo"] });
      queryClient.invalidateQueries({ queryKey: ["rh-meus-ajustes"] });
      toast.success("Solicitação enviada. O RH irá analisar o pedido.");
      setForm(emptyForm);
      setSelectedScheduleFields([]);
      setStep(1);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const selectedFields = useMemo(() => {
    const filledFields = getSelectedScheduleFields(form);
    const merged = new Set<ScheduleField>([...selectedScheduleFields, ...filledFields]);

    return Array.from(merged);
  }, [form, selectedScheduleFields]);
  const currentStep = steps[step - 1];
  const currentStepError = getWizardError(step, form);
  const isCurrentStepValid = isWizardStepValid(step, form);
  const canReview = isWizardStepValid(1, form) && isWizardStepValid(2, form) && isWizardStepValid(3, form);

  const toggleField = (field: ScheduleField) => {
    if (field === "intervaloInicio" || field === "intervaloFim") {
      const shouldEnable = !selectedFields.includes("intervaloInicio") && !selectedFields.includes("intervaloFim");
      setSelectedScheduleFields((current) =>
        shouldEnable
          ? Array.from(new Set<ScheduleField>([...current, "intervaloInicio", "intervaloFim"]))
          : current.filter((item) => item !== "intervaloInicio" && item !== "intervaloFim")
      );
      setForm((current) => ({
        ...current,
        intervaloInicio: shouldEnable ? current.intervaloInicio : "",
        intervaloFim: shouldEnable ? current.intervaloFim : "",
      }));
      return;
    }

    const shouldEnable = !selectedFields.includes(field);
    setSelectedScheduleFields((current) =>
      shouldEnable ? [...current, field] : current.filter((item) => item !== field)
    );
    setForm((current) => ({
      ...current,
      [field]: shouldEnable ? current[field] : "",
    }));
  };

  const isFieldSelected = (field: ScheduleField) => selectedFields.includes(field);

  const updateField = (field: keyof typeof emptyForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const reviewItems = selectedFields.map((field) => ({
    label: fieldLabels[field],
    value: form[field],
  }));

  const getScheduleButtonLabel = (field: ScheduleField) => {
    const label = fieldLabels[field];
    const selected = isFieldSelected(field);

    if (field === "intervaloInicio" || field === "intervaloFim") {
      return `${label}. ${intervalHelperTitle}. ${intervalHelperDescription}. ${
        selected ? "Selecionado" : "Não selecionado"
      }.`;
    }

    return `${label}. ${selected ? "Selecionado" : "Não selecionado"}.`;
  };

  const handleNext = () => {
    if (!isCurrentStepValid || step === 3) {
      return;
    }

    setStep((current) => (current + 1) as 2 | 3);
  };

  const handleBack = () => {
    if (step === 1) {
      return;
    }

    setStep((current) => (current - 1) as 1 | 2);
  };

  return (
    <>
      <EmployeeRequestCard
        title="Solicitar ajuste"
        description={currentStep.description}
        actionLabel={createAjusteMutation.isPending ? "Enviando..." : "Enviar ajuste"}
        actionDisabled={createAjusteMutation.isPending || !canReview}
        onSubmit={() => createAjusteMutation.mutate()}
        footer={
          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Etapa {step} de 3</span>
              {currentStepError ? <span className="text-destructive">{currentStepError}</span> : null}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={handleBack} disabled={step === 1 || createAjusteMutation.isPending}>
                Voltar
              </Button>
              {step < 3 ? (
                <Button onClick={handleNext} disabled={!isCurrentStepValid || createAjusteMutation.isPending}>
                  {step === 2 ? "Revisar solicitação" : "Continuar"}
                </Button>
              ) : (
                <Button onClick={() => createAjusteMutation.mutate()} disabled={!canReview || createAjusteMutation.isPending}>
                  {createAjusteMutation.isPending ? "Enviando..." : "Enviar solicitação"}
                </Button>
              )}
            </div>
          </div>
        }
      >
        <div className="grid gap-3 md:grid-cols-3">
          {steps.map((item, index) => {
            const itemStep = (index + 1) as 1 | 2 | 3;
            const isActive = itemStep === step;
            const isDone = itemStep < step;

            return (
              <div
                key={item.title}
                className={`rounded-lg border p-4 transition-colors ${
                  isActive ? "border-primary bg-primary/5" : isDone ? "border-emerald-200 bg-emerald-50/60" : "bg-muted/30"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <Badge variant={isActive ? "default" : isDone ? "success" : "secondary"}>{itemStep}</Badge>
                </div>
              </div>
            );
          })}
        </div>

        {step === 1 ? (
          <Field label="Data" error={currentStepError ?? undefined}>
            <Input type="date" value={form.dataReferencia} onChange={(e) => updateField("dataReferencia", e.target.value)} />
          </Field>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm font-medium">Quais horários precisam ser corrigidos?</p>
              <div className="grid gap-3 md:grid-cols-2">
                {AJUSTE_HORARIO_OPTIONS.filter((option) => option.label === "Entrada" || option.label === "Saída").map((option) => {
                  const selected = option.fields.some(isFieldSelected);

                  return (
                    <button
                      key={option.label}
                      type="button"
                      aria-pressed={selected}
                      aria-label={getScheduleButtonLabel(option.fields[0])}
                      onClick={() => toggleField(option.fields[0])}
                      className={`rounded-lg border p-4 text-left transition-colors ${
                        selected ? "border-primary bg-primary/5" : "hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{option.label}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Preencha somente se este horário estiver incorreto.
                          </p>
                        </div>
                        <Badge variant={selected ? "default" : "secondary"}>{selected ? "Selecionado" : "Opcional"}</Badge>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-lg border bg-muted/20 p-4">
                <div className="mb-3">
                  <p className="text-sm font-medium">{intervalHelperTitle}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{intervalHelperDescription}</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {AJUSTE_HORARIO_OPTIONS.filter((option) => option.label === "Saída para intervalo" || option.label === "Volta do intervalo").map((option) => {
                    const selected = option.fields.some(isFieldSelected);

                    return (
                      <button
                        key={option.label}
                        type="button"
                        aria-pressed={selected}
                        aria-label={getScheduleButtonLabel(option.fields[0])}
                        onClick={() => toggleField(option.fields[0])}
                        className={`rounded-lg border p-4 text-left transition-colors ${
                          selected ? "border-primary bg-primary/5" : "bg-background hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium">{option.label}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{intervalHelperDescription}</p>
                          </div>
                          <Badge variant={selected ? "default" : "secondary"}>{selected ? "Selecionado" : "Opcional"}</Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Você pode corrigir apenas um horário. Se for o intervalo, informe a saída e a volta.
              </p>
              {currentStepError ? <p className="text-xs text-destructive">{currentStepError}</p> : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {isFieldSelected("entrada") ? (
                <Field label="Entrada">
                  <Input type="time" value={form.entrada} onChange={(e) => updateField("entrada", e.target.value)} />
                </Field>
              ) : null}
              {isFieldSelected("intervaloInicio") || isFieldSelected("intervaloFim") ? (
                <>
                  <Field label="Saída para intervalo">
                    <Input
                      type="time"
                      value={form.intervaloInicio}
                      onChange={(e) => updateField("intervaloInicio", e.target.value)}
                    />
                  </Field>
                  <Field label="Volta do intervalo">
                    <Input
                      type="time"
                      value={form.intervaloFim}
                      onChange={(e) => updateField("intervaloFim", e.target.value)}
                    />
                  </Field>
                </>
              ) : null}
              {isFieldSelected("saida") ? (
                <Field label="Saída">
                  <Input type="time" value={form.saida} onChange={(e) => updateField("saida", e.target.value)} />
                </Field>
              ) : null}
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <Field label="Justificativa" error={currentStepError ?? undefined}>
              <Textarea
                value={form.justificativa}
                onChange={(e) => updateField("justificativa", e.target.value)}
                rows={4}
                placeholder="Ex.: Esqueci de registrar minha saída às 17h porque fui chamado para uma reunião."
              />
            </Field>

            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm font-semibold">Revisão da solicitação</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Dia</p>
                  <p className="mt-1 text-sm font-medium">
                    {form.dataReferencia
                      ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(
                          new Date(`${form.dataReferencia}T00:00:00`)
                        )
                      : "Não informado"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Horários selecionados</p>
                  <div className="mt-1 space-y-1 text-sm">
                    {reviewItems.map((item) => (
                      <p key={item.label}>
                        <span className="font-medium">{item.label}:</span> {item.value}
                      </p>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs uppercase text-muted-foreground">Justificativa</p>
                  <p className="mt-1 text-sm">{form.justificativa || "Não informada"}</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </EmployeeRequestCard>
      <EmployeeTimeline items={meusAjustesQuery.data?.items ?? []} loading={meusAjustesQuery.isLoading} type="ajuste" />
    </>
  );
}
