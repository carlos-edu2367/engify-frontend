import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/utils";
import { rhService } from "@/services/rh.service";
import { EmployeeRequestCard, EmployeeTimeline, Field } from "../rh-shared";
import { buildDateEnd, buildDateStart } from "../rh-utils";

interface RequestFeriasViewProps {
  startDate?: string;
  endDate?: string;
}

export function RequestFeriasView({ startDate, endDate }: RequestFeriasViewProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    inicio: "",
    fim: "",
  });

  const minhasFeriasQuery = useQuery({
    queryKey: ["rh-minhas-ferias", startDate, endDate],
    queryFn: () =>
      rhService.listFerias({
        page: 1,
        limit: 50,
        start: startDate ? buildDateStart(startDate) : undefined,
        end: endDate ? buildDateEnd(endDate) : undefined,
      }),
  });

  const createFeriasMutation = useMutation({
    mutationFn: () =>
      rhService.createFerias({
        data_inicio: buildDateStart(form.inicio),
        data_fim: buildDateEnd(form.fim),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rh-me-resumo"] });
      queryClient.invalidateQueries({ queryKey: ["rh-minhas-ferias"] });
      toast.success("Solicitacao de ferias enviada.");
      setForm({ inicio: "", fim: "" });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  return (
    <>
      <EmployeeRequestCard
        title="Solicitar ferias"
        description="Escolha o periodo desejado para o RH avaliar."
        actionLabel={createFeriasMutation.isPending ? "Enviando..." : "Enviar solicitacao"}
        actionDisabled={createFeriasMutation.isPending}
        onSubmit={() => createFeriasMutation.mutate()}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Inicio">
            <Input
              type="date"
              value={form.inicio}
              onChange={(e) => setForm({ ...form, inicio: e.target.value })}
            />
          </Field>
          <Field label="Fim">
            <Input
              type="date"
              value={form.fim}
              onChange={(e) => setForm({ ...form, fim: e.target.value })}
            />
          </Field>
        </div>
      </EmployeeRequestCard>
      <EmployeeTimeline items={minhasFeriasQuery.data?.items ?? []} loading={minhasFeriasQuery.isLoading} type="ferias" />
    </>
  );
}
