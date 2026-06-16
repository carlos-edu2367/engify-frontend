import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { PageTransition } from "@/components/layout/PageTransition";
import { EmployeeRhView } from "@/components/features/rh/employee/EmployeeRhView";
import { useAuthStore } from "@/store/auth.store";
import { rhService } from "@/services/rh.service";

export function MeuRhPage() {
  const user = useAuthStore((s) => s.user);
  const vinculoQuery = useQuery({
    queryKey: ["rh-me-vinculo"],
    queryFn: rhService.getMyVinculo,
    enabled: !!user,
    staleTime: 60_000,
    retry: false,
  });

  if (user?.role === "funcionario" && vinculoQuery.data && vinculoQuery.data.vinculado === false) {
    return (
      <PageTransition>
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
          <Building2 className="size-10 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Sua conta ainda não está vinculada a um funcionário</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            Peça ao RH da sua empresa para vincular seu acesso ao seu cadastro de funcionário.
            Assim que isso acontecer, sua área de RH aparecerá aqui.
          </p>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <EmployeeRhView />
    </PageTransition>
  );
}
