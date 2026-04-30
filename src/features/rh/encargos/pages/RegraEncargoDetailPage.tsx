import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { rhService } from "@/services/rh.service";
import type { RhRegraEncargo } from "@/types/rh.types";
import { PermissionGate } from "../../shared/components/PermissionGate";
import { RhImpactChecklist } from "../../shared/components/RhImpactChecklist";
import { RhPageHeader } from "../../shared/components/RhPageHeader";
import { RhStatusBadge } from "../../shared/components/RhStatusBadge";
import { formatRhDate } from "../../shared/utils/formatters";
import { rhQueryKeys } from "../../shared/utils/queryKeys";

export function RegraEncargoDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [motivo, setMotivo] = useState("");
  const query = useQuery({
    queryKey: rhQueryKeys.encargos.regras({ detail: id }),
    queryFn: () => rhService.getRegraEncargo(id!) as Promise<RhRegraEncargo>,
    enabled: !!id,
  });
  const regra = query.data;
  const invalidate = () => queryClient.invalidateQueries({ queryKey: [...rhQueryKeys.all, "encargos", "regras"] });
  const activate = useMutation({ mutationFn: () => rhService.activateRegraEncargo(id!, motivo), onSuccess: invalidate });
  const inactivate = useMutation({ mutationFn: () => rhService.inactivateRegraEncargo(id!, motivo), onSuccess: invalidate });

  return (
    <PermissionGate permission="rh.regras.activate" showDeniedState>
      <div className="flex flex-col gap-6">
        <RhPageHeader title={regra?.nome ?? "Regra de encargo"} description="Ativacao e inativacao exigem motivo e confirmacao de impacto." />
        <Card>
          <CardHeader>
            <CardTitle>Detalhes</CardTitle>
            <CardDescription>{regra?.codigo ?? "Codigo nao informado"}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <Detail label="Status" value={regra ? <RhStatusBadge status={regra.status} /> : "Carregando"} />
            <Detail label="Natureza" value={regra?.natureza ?? "Nao informada"} />
            <Detail label="Tipo de calculo" value={regra?.tipo_calculo ?? "Nao informado"} />
            <Detail label="Base" value={regra?.base_calculo ?? "Nao informada"} />
            <Detail label="Versao" value={String(regra?.versao ?? "Nao informada")} />
            <Detail label="Vigencia" value={`${formatRhDate(regra?.vigencia_inicio)} ate ${formatRhDate(regra?.vigencia_fim)}`} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Acoes criticas</CardTitle>
            <CardDescription>Revise o checklist e informe o motivo para auditoria.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RhImpactChecklist
              items={[
                { id: "vigencia", label: "Vigencia conferida", description: "Conflitos de vigencia sao bloqueados antes da ativacao.", checked: true },
                { id: "folha", label: "Impacto em folha entendido", description: "A regra ativa pode alterar proximas geracoes de folha.", checked: true },
              ]}
              onToggle={() => undefined}
            />
            <Textarea value={motivo} onChange={(event) => setMotivo(event.target.value)} placeholder="Motivo da ativacao ou inativacao" />
            <div className="flex flex-wrap gap-2">
              <Button disabled={!motivo.trim() || activate.isPending} onClick={() => activate.mutate()}>Ativar regra</Button>
              <Button variant="destructive" disabled={!motivo.trim() || inactivate.isPending} onClick={() => inactivate.mutate()}>Inativar regra</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PermissionGate>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-md border p-3"><p className="text-xs uppercase text-muted-foreground">{label}</p><div className="mt-1 font-medium">{value}</div></div>;
}
