import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { rhService } from "@/services/rh.service";
import { EmployeeSummarySection } from "../rh-shared";
import { EmployeePointStateSection } from "./EmployeePointStateSection";
import { EmployeeTodayCard } from "./EmployeeTodayCard";

export function EmployeeOverviewTab() {
  const resumoQuery = useQuery({
    queryKey: ["rh-me-resumo"],
    queryFn: rhService.getMyResumo,
  });

  return (
    <div className="space-y-4">
      <EmployeeSummarySection summary={resumoQuery.data} loading={resumoQuery.isLoading} />
      {resumoQuery.isLoading ? (
        <Skeleton className="h-44" />
      ) : (
        <>
          <EmployeeTodayCard hoje={resumoQuery.data?.ponto_hoje} />
          <EmployeePointStateSection state={resumoQuery.data?.estado_ponto_7_dias} />
        </>
      )}
    </div>
  );
}
