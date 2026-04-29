import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/utils";
import { rhService } from "@/services/rh.service";
import { EmployeeRequestCard, EmployeeTimeline, Field } from "../rh-shared";
import { buildDateEnd, buildDateStart, combineDateAndTime } from "../rh-utils";

interface RequestAjustesViewProps {
  startDate?: string;
  endDate?: string;
}

export function RequestAjustesView({ startDate, endDate }: RequestAjustesViewProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    dataReferencia: "",
    justificativa: "",
    entrada: "",
    saida: "",
  });

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
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rh-me-resumo"] });
      queryClient.invalidateQueries({ queryKey: ["rh-meus-ajustes"] });
      toast.success("Ajuste enviado.");
      setForm({
        dataReferencia: "",
        justificativa: "",
        entrada: "",
        saida: "",
      });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  return (
    <>
      <EmployeeRequestCard
        title="Solicitar ajuste"
        description="Informe a data, os horarios desejados e a justificativa."
        actionLabel={createAjusteMutation.isPending ? "Enviando..." : "Enviar ajuste"}
        actionDisabled={createAjusteMutation.isPending}
        onSubmit={() => createAjusteMutation.mutate()}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Data">
            <Input
              type="date"
              value={form.dataReferencia}
              onChange={(e) => setForm({ ...form, dataReferencia: e.target.value })}
            />
          </Field>
          <Field label="Entrada">
            <Input
              type="time"
              value={form.entrada}
              onChange={(e) => setForm({ ...form, entrada: e.target.value })}
            />
          </Field>
          <Field label="Saida">
            <Input
              type="time"
              value={form.saida}
              onChange={(e) => setForm({ ...form, saida: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Justificativa">
          <Textarea
            value={form.justificativa}
            onChange={(e) => setForm({ ...form, justificativa: e.target.value })}
            rows={3}
          />
        </Field>
      </EmployeeRequestCard>
      <EmployeeTimeline items={meusAjustesQuery.data?.items ?? []} loading={meusAjustesQuery.isLoading} type="ajuste" />
    </>
  );
}

