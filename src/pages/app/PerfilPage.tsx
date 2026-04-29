import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageTransition } from "@/components/layout/PageTransition";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { rhService } from "@/services/rh.service";
import { usersService } from "@/services/users.service";
import { useAuthStore } from "@/store/auth.store";
import { formatCurrency, getInitials, getApiErrorMessage } from "@/lib/utils";

const perfilSchema = z.object({
  nome: z.string().min(3, "Nome deve ter ao menos 3 caracteres"),
  email: z.string().email("Email inválido"),
});

type PerfilFormValues = z.infer<typeof perfilSchema>;

export function PerfilPage() {
  const { user, setUser } = useAuthStore();
  const holeritesQuery = useQuery({
    queryKey: ["meus-holerites"],
    queryFn: () => rhService.listMyHolerites(1, 12),
    enabled: user?.role === "funcionario",
  });

  const mutation = useMutation({
    mutationFn: (v: PerfilFormValues) => usersService.updateMe(v),
    onSuccess: (updated) => {
      setUser({
        id: user!.id,
        nome: updated.nome,
        email: updated.email,
        role: user!.role,
        teamId: user!.teamId,
      });
      toast.success("Perfil atualizado!");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PerfilFormValues>({
    resolver: zodResolver(perfilSchema),
    values: user ? { nome: user.nome, email: user.email } : undefined,
  });

  return (
    <PageTransition>
      <div className="max-w-lg space-y-6">
        <h1 className="text-2xl font-bold">Meu Perfil</h1>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {user ? getInitials(user.nome) : "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-semibold">{user?.nome}</p>
                <p className="text-sm text-muted-foreground capitalize">{user?.role}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nome</Label>
                <Input {...register("nome")} />
                {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" {...register("email")} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Salvando..." : "Salvar alterações"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {user?.role === "funcionario" && (
          <Card>
            <CardHeader>
              <div>
                <p className="text-lg font-semibold">Meus holerites</p>
                <p className="text-sm text-muted-foreground">Consulta somente leitura das competencias processadas.</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {holeritesQuery.isLoading ? (
                <>
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </>
              ) : (holeritesQuery.data?.items.length ?? 0) === 0 ? (
                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  Nenhum holerite disponivel ate o momento.
                </div>
              ) : (
                holeritesQuery.data?.items.map((item) => (
                  <div key={item.id} className="rounded-md border p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">
                          {String(item.mes_referencia).padStart(2, "0")}/{item.ano_referencia}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Base {formatCurrency(item.salario_base)} · Extras {formatCurrency(item.horas_extras)}
                        </p>
                      </div>
                      <Badge variant={item.status === "fechado" ? "success" : "warning"}>
                        {item.status === "fechado" ? "Fechado" : "Rascunho"}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm font-medium">Liquido {formatCurrency(item.valor_liquido)}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
