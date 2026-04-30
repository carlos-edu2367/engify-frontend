import { PageTransition } from "@/components/layout/PageTransition";
import { EmployeeRhView } from "@/components/features/rh/employee/EmployeeRhView";

export function MeuRhPage() {
  return (
    <PageTransition>
      <EmployeeRhView />
    </PageTransition>
  );
}
