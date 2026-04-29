import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { RhStatusPonto } from "@/types/rh.types";
import { Field, HistorySection, statusLabel } from "../rh-shared";
import {
  buildDateEnd,
  buildDateStart,
  formatDateTime,
  getCurrentPosition,
} from "../rh-utils";

const pointStatusOptions: Array<{ value: RhStatusPonto | "all"; label: string }> = [
  { value: "all", label: "Todos os status" },
  { value: "validado", label: "Validado" },
  { value: "negado", label: "Negado" },
  { value: "inconsistente", label: "Inconsistente" },
  { value: "ajustado", label: "Ajustado" },
];

export function EmployeeTimeTrackingTab() {
  const queryClient = useQueryClient();
  const [pointStart, setPointStart] = useState("");
  const [pointEnd, setPointEnd] = useState("");
  const [pointStatus, setPointStatus] = useState<RhStatusPonto | "all">("all");

  const meusPontosQuery = useQuery({
    queryKey: ["rh-meus-pontos", pointStatus, pointStart, pointEnd],
    queryFn: () =>
      rhService.listMyPontos({
        page: 1,
        limit: 50,
        status: pointStatus === "all" ? undefined : pointStatus,
        start: pointStart ? buildDateStart(pointStart) : undefined,
        end: pointEnd ? buildDateEnd(pointEnd) : undefined,
      }),
  });

  const registrarPontoMutation = useMutation({
    mutationFn: async (tipo: "entrada" | "saida") => {
      toast.info("Obtendo localizacao e registrando ponto...");
      const position = await getCurrentPosition();
      return rhService.registrarPonto({

        tipo,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        client_timestamp: new Date().toISOString(),
        gps_accuracy_meters: position.coords.accuracy,
        device_fingerprint: navigator.userAgent,
      });
    },
    onSuccess: (registro) => {
      queryClient.invalidateQueries({ queryKey: ["rh-me-resumo"] });
      queryClient.invalidateQueries({ queryKey: ["rh-meus-pontos"] });
      toast.success(`Ponto ${statusLabel(registro.status).toLowerCase()} em ${formatDateTime(registro.timestamp)}.`);
    },
    onError: (error) => {
      console.error("Erro ao registrar ponto:", error);
      toast.error(getApiErrorMessage(error));
    },
  });

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Fingerprint className="h-5 w-5" />
            Registrar ponto
          </CardTitle>
          <CardDescription>
            O envio usa sua localizacao atual, gera chave de idempotencia e bloqueia toques duplicados enquanto valida.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Button
            size="lg"
            className="h-16 justify-start text-left"
            disabled={registrarPontoMutation.isPending}
            onClick={() => registrarPontoMutation.mutate("entrada")}
          >
            <div>
              <div className="font-semibold">Entrada</div>
              <div className="text-xs opacity-80">Registrar inicio da jornada</div>
            </div>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-16 justify-start text-left"
            disabled={registrarPontoMutation.isPending}
            onClick={() => registrarPontoMutation.mutate("saida")}
          >
            <div>
              <div className="font-semibold">Saida</div>
              <div className="text-xs opacity-80">Registrar fim da jornada</div>
            </div>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Filtros de ponto</CardTitle>
          <CardDescription>Consulte os registros recentes por periodo e status.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Field label="Status">
            <Select value={pointStatus} onValueChange={(value) => setPointStatus(value as RhStatusPonto | "all")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pointStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Inicio">
            <Input type="date" value={pointStart} onChange={(event) => setPointStart(event.target.value)} />
          </Field>
          <Field label="Fim">
            <Input type="date" value={pointEnd} onChange={(event) => setPointEnd(event.target.value)} />
          </Field>
        </CardContent>
      </Card>

      <HistorySection items={meusPontosQuery.data?.items ?? []} loading={meusPontosQuery.isLoading} />
    </div>
  );
}
