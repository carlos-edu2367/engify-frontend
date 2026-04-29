import { useQuery } from "@tanstack/react-query";
import { rhService } from "@/services/rh.service";
import { EmployeeSummarySection } from "../rh-shared";

export function EmployeeOverviewTab() {
  const resumoQuery = useQuery({
    queryKey: ["rh-me-resumo"],
    queryFn: rhService.getMyResumo,
  });

  return (
    <div className="space-y-4">
      <EmployeeSummarySection summary={resumoQuery.data} loading={resumoQuery.isLoading} />
    </div>
  );
}
