import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmployeeOverviewTab } from "./EmployeeOverviewTab";
import { EmployeeTimeTrackingTab } from "./EmployeeTimeTrackingTab";
import { EmployeeRequestsTab } from "./EmployeeRequestsTab";
import { EmployeePayslipsTab } from "./EmployeePayslipsTab";

export function EmployeeRhView() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Minha area RH</h1>
        <p className="text-sm text-muted-foreground">
          Jornada, solicitacoes e holerites em uma area unica com historico e filtros.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex w-full flex-wrap justify-start">
          <TabsTrigger value="overview">Visao geral</TabsTrigger>
          <TabsTrigger value="ponto">Ponto eletrônico</TabsTrigger>
          <TabsTrigger value="requests">Solicitacoes</TabsTrigger>
          <TabsTrigger value="holerites">Holerites</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <EmployeeOverviewTab />
        </TabsContent>

        <TabsContent value="ponto">
          <EmployeeTimeTrackingTab />
        </TabsContent>

        <TabsContent value="requests">
          <EmployeeRequestsTab />
        </TabsContent>

        <TabsContent value="holerites">
          <EmployeePayslipsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
