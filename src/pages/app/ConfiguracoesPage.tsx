import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageTransition } from "@/components/layout/PageTransition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { teamsService } from "@/services/teams.service";
import { updateTeamSchema, type UpdateTeamFormValues } from "@/lib/schemas/team.schemas";
import { formatCNPJ, getApiErrorMessage } from "@/lib/utils";

export function ConfiguracoesPage() {
  const queryClient = useQueryClient();

  const { data: team, isLoading } = useQuery({
    queryKey: ["team"],
    queryFn: () => teamsService.getMe(),
  });

  const mutation = useMutation({
    mutationFn: (v: UpdateTeamFormValues) => teamsService.updateMe(v),
    onSuccess: (updated) => {
      queryClient.setQueryData(["team"], updated);
      toast.success("Configurações salvas!");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateTeamFormValues>({
    resolver: zodResolver(updateTeamSchema),
    values: team ? { title: team.title } : undefined,
  });

  return (
    <PageTransition>
      <div className="max-w-lg space-y-6">
        <h1 className="text-2xl font-bold">Configurações</h1>

        <Card>
          <CardHeader>
            <CardTitle>Dados do Time</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Nome da empresa</Label>
                  <Input {...register("title")} />
                  {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>CNPJ</Label>
                  <Input value={team?.cnpj ? formatCNPJ(team.cnpj) : ""} disabled />
                  <p className="text-xs text-muted-foreground">O CNPJ não pode ser alterado.</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Plano atual</Label>
                  <Input
                    value={
                      team?.plan === "trial"
                        ? `Trial (${team.days_to_expire ?? 0} dias restantes)`
                        : (team?.plan ?? "")
                    }
                    disabled
                    className="capitalize"
                  />
                </div>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Salvando..." : "Salvar alterações"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
