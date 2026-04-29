import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { RhStatusAtestado } from "@/types/rh.types";
import { Field } from "../rh-shared";
import { RequestAjustesView } from "./RequestAjustesView";
import { RequestFeriasView } from "./RequestFeriasView";
import { RequestAtestadosView } from "./RequestAtestadosView";

const atestadoStatusOptions: Array<{ value: RhStatusAtestado | "all"; label: string }> = [
  { value: "all", label: "Todos os status" },
  { value: "aguardando_entrega", label: "Aguardando entrega" },
  { value: "entregue", label: "Entregue" },
  { value: "vencido", label: "Vencido" },
  { value: "rejeitado", label: "Rejeitado" },
];

export function EmployeeRequestsTab() {
  const [requestStart, setRequestStart] = useState("");
  const [requestEnd, setRequestEnd] = useState("");
  const [atestadoStatus, setAtestadoStatus] = useState<RhStatusAtestado | "all">("all");

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Filtros das solicitacoes</CardTitle>
          <CardDescription>Acompanhe ajustes, ferias e atestados com a mesma janela de datas.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Field label="Inicio">
            <Input type="date" value={requestStart} onChange={(e) => setRequestStart(e.target.value)} />
          </Field>
          <Field label="Fim">
            <Input type="date" value={requestEnd} onChange={(e) => setRequestEnd(e.target.value)} />
          </Field>
          <Field label="Status do atestado">
            <Select value={atestadoStatus} onValueChange={(value) => setAtestadoStatus(value as RhStatusAtestado | "all")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {atestadoStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </CardContent>
      </Card>

      <Tabs defaultValue="ajustes" className="space-y-4">
        <TabsList className="flex w-full flex-wrap justify-start">
          <TabsTrigger value="ajustes">Ajustes</TabsTrigger>
          <TabsTrigger value="ferias">Ferias</TabsTrigger>
          <TabsTrigger value="atestados">Atestados</TabsTrigger>
        </TabsList>

        <TabsContent value="ajustes">
          <RequestAjustesView startDate={requestStart} endDate={requestEnd} />
        </TabsContent>

        <TabsContent value="ferias">
          <RequestFeriasView startDate={requestStart} endDate={requestEnd} />
        </TabsContent>

        <TabsContent value="atestados">
          <RequestAtestadosView startDate={requestStart} endDate={requestEnd} status={atestadoStatus} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
