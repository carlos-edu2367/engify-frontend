import { PageTransition } from "@/components/layout/PageTransition";
import { EmployeeRhView } from "@/components/features/rh/employee/EmployeeRhView";
import { useAuthStore } from "@/store/auth.store";
import { rhAdminRoutes } from "@/features/rh";

export function RhPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <PageTransition>
      <div className="flex flex-col gap-6">
        {user?.role === "funcionario" ? <EmployeeRhView /> : rhAdminRoutes.dashboard}
      </div>
    </PageTransition>
  );
}
