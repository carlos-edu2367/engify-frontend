import { PageTransition } from "@/components/layout/PageTransition";
import { AdminRhView } from "@/components/features/rh/AdminRhView";
import { EmployeeRhView } from "@/components/features/rh/employee/EmployeeRhView";
import { useAuthStore } from "@/store/auth.store";
import { DevelopmentWarning } from "@/components/features/rh/rh-shared";

export function RhPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <PageTransition>
      <div className="flex flex-col gap-6">
        <DevelopmentWarning />
        {user?.role === "funcionario" ? <EmployeeRhView /> : <AdminRhView />}
      </div>
    </PageTransition>
  );
}
