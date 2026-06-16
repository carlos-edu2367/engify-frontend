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
        <TabsList className="flex w-full justify-start gap-1 overflow-x-auto whitespace-nowrap [-webkit-overflow-scrolling:touch] sm:flex-wrap">
          <TabsTrigger value="overview" className="min-h-11">Visao geral</TabsTrigger>
          <TabsTrigger value="ponto" className="min-h-11">Ponto eletrônico</TabsTrigger>
          <TabsTrigger value="requests" className="min-h-11">Solicitacoes</TabsTrigger>
          <TabsTrigger value="holerites" className="min-h-11">Holerites</TabsTrigger>
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
