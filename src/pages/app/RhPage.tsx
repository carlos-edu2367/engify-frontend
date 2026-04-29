import { PageTransition } from "@/components/layout/PageTransition";
import { AdminRhView } from "@/components/features/rh/AdminRhView";
import { EmployeeRhView } from "@/components/features/rh/employee/EmployeeRhView";
import { useAuthStore } from "@/store/auth.store";

export function RhPage() {
  const user = useAuthStore((state) => state.user);

  return <PageTransition>{user?.role === "funcionario" ? <EmployeeRhView /> : <AdminRhView />}</PageTransition>;
}
