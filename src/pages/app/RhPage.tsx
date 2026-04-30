import { PageTransition } from "@/components/layout/PageTransition";
import { rhAdminRoutes } from "@/features/rh";

export function RhPage() {
  return (
    <PageTransition>
      <div className="flex flex-col gap-6">
        {rhAdminRoutes.dashboard}
      </div>
    </PageTransition>
  );
}
