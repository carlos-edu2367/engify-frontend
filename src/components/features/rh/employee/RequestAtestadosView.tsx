import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getApiErrorMessage } from "@/lib/utils";
import { rhService } from "@/services/rh.service";
import { EmployeeRequestCard, EmployeeTimeline, Field } from "../rh-shared";
import { buildDateEnd, buildDateStart } from "../rh-utils";

interface RequestAtestadosViewProps {
  startDate?: string;
  endDate?: string;
  status?: string;
}

export function RequestAtestadosView({ startDate, endDate, status }: RequestAtestadosViewProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    tipoId: "",
    inicio: "",
    fim: "",
    arquivo: "",
  });

  const meusAtestadosQuery = useQuery({
    queryKey: ["rh-meus-atestados", startDate, endDate, status],
    queryFn: () =>
      rhService.listAtestados({
        page: 1,
        limit: 50,
        status: status === "all" ? undefined : (status as any),
        start: startDate ? buildDateStart(startDate) : undefined,
        end: endDate ? buildDateEnd(endDate) : undefined,
      }),
  });

  const tiposAtestadoQuery = useQuery({
    queryKey: ["rh-tipos-atestado"],
    queryFn: () => rhService.listTiposAtestado(1, 100),
  });

  const createAtestadoMutation = useMutation({
    mutationFn: () =>
      rhService.createAtestado({
        tipo_atestado_id: form.tipoId,
        data_inicio: buildDateStart(form.inicio),
        data_fim: buildDateEnd(form.fim),
        file_path: form.arquivo.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rh-me-resumo"] });
      queryClient.invalidateQueries({ queryKey: ["rh-meus-atestados"] });
      toast.success("Atestado enviado.");
      setForm({
        tipoId: "",
        inicio: "",
        fim: "",
        arquivo: "",
      });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const openAtestado = async (id: string) => {
    try {
      const response = await rhService.getAtestadoDownloadUrl(id);
      window.open(response.download_url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <>
      <EmployeeRequestCard
        title="Enviar atestado"
        description="Selecione o tipo, periodo e informe o caminho do documento armazenado."
        actionLabel={createAtestadoMutation.isPending ? "Enviando..." : "Enviar atestado"}
        actionDisabled={createAtestadoMutation.isPending}
        onSubmit={() => createAtestadoMutation.mutate()}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Tipo">
            <Select
              value={form.tipoId}
              onValueChange={(value) => setForm({ ...form, tipoId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {(tiposAtestadoQuery.data?.items ?? []).map((tipo) => (
                  <SelectItem key={tipo.id} value={tipo.id}>
                    {tipo.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
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
        <Field label="file_path do documento">
          <Input
            value={form.arquivo}
            onChange={(e) => setForm({ ...form, arquivo: e.target.value })}
            placeholder="financeiro/<uuid>/arquivo.pdf"
          />
        </Field>
        <p className="text-xs text-muted-foreground">
          O backend atual valida o atestado a partir do `file_path` armazenado. O upload binario direto ainda depende de suporte especifico no storage para RH.
        </p>
      </EmployeeRequestCard>
      <EmployeeTimeline
        items={meusAtestadosQuery.data?.items ?? []}
        loading={meusAtestadosQuery.isLoading}
        type="atestado"
        renderActions={(item) =>
          "has_file" in item && item.has_file ? (
            <Button variant="outline" size="sm" onClick={() => openAtestado(item.id)}>
              <FileSearch className="h-4 w-4" />
              Abrir
            </Button>
          ) : null
        }
      />
    </>
  );
}
