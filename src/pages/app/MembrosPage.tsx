import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Users, UserCog } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageTransition } from "@/components/layout/PageTransition";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { usersService } from "@/services/users.service";
import { teamsService } from "@/services/teams.service";
import { inviteSchema, diaristaSchema, type InviteFormValues, type DiaristaFormValues } from "@/lib/schemas/team.schemas";
import { formatCurrency, getApiErrorMessage } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { RoleGuard } from "@/components/shared/RoleGuard";

const roleLabels: Record<string, string> = {
  admin: "Admin",
  engenheiro: "Engenheiro",
  financeiro: "Financeiro",
  cliente: "Cliente",
  funcionario: "UsuÃ¡rio comum",
};

const roleBadge: Record<string, "default" | "info" | "warning" | "success"> = {
  admin: "default",
  engenheiro: "info",
  financeiro: "warning",
  cliente: "success",
  funcionario: "default",
};

export function MembrosPage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [diaristaCriarOpen, setDiaristaCriarOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteDiaristaId, setDeleteDiaristaId] = useState<string | null>(null);

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersService.list(),
  });

  const { data: diaristasData, isLoading: diaristasLoading } = useQuery({
    queryKey: ["diaristas"],
    queryFn: () => teamsService.getDiaristas(),
  });

  const inviteMutation = useMutation({
    mutationFn: (v: InviteFormValues) => teamsService.invite(v),
    onSuccess: () => {
      toast.success("Convite enviado com sucesso!");
      setInviteOpen(false);
      resetInvite();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => usersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuário removido.");
      setDeleteUserId(null);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const createDiaristaMutation = useMutation({
    mutationFn: (v: DiaristaFormValues) => teamsService.createDiarista(v),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diaristas"] });
      toast.success("Diarista adicionado!");
      setDiaristaCriarOpen(false);
      resetDiarista();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const deleteDiaristaMutation = useMutation({
    mutationFn: (id: string) => teamsService.deleteDiarista(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diaristas"] });
      toast.success("Diarista removido.");
      setDeleteDiaristaId(null);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const {
    register: registerInvite,
    handleSubmit: handleSubmitInvite,
    setValue: setValueInvite,
    reset: resetInvite,
    formState: { errors: errorsInvite },
  } = useForm<InviteFormValues>({ resolver: zodResolver(inviteSchema) });

  const {
    register: registerDiarista,
    handleSubmit: handleSubmitDiarista,
    reset: resetDiarista,
    formState: { errors: errorsDiarista },
  } = useForm<DiaristaFormValues>({ resolver: zodResolver(diaristaSchema) });

  const diaristas = diaristasData?.items ?? [];

  return (
    <PageTransition>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Membros</h1>

        <Tabs defaultValue="usuarios">
          <TabsList>
            <TabsTrigger value="usuarios">
              <Users className="h-4 w-4 mr-1.5" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="diaristas">
              <UserCog className="h-4 w-4 mr-1.5" />
              Diaristas
            </TabsTrigger>
          </TabsList>

          {/* Usuários */}
          <TabsContent value="usuarios" className="mt-4 space-y-4">
            <RoleGuard roles={["admin"]}>
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setInviteOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Convidar Membro
                </Button>
              </div>
            </RoleGuard>
            {usersLoading ? (
              <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
            ) : users.length === 0 ? (
              <EmptyState title="Nenhum membro encontrado" icon={<Users className="h-10 w-10" />} />
            ) : (
              <div className="space-y-2">
                {users.map((u) => (
                  <Card key={u.user_id}>
                    <CardContent className="flex items-center justify-between py-4">
                      <div>
                        <p className="font-medium">{u.nome}</p>
                        <p className="text-sm text-muted-foreground">{u.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={roleBadge[u.role] ?? "default"}>
                          {roleLabels[u.role] ?? u.role}
                        </Badge>
                        <RoleGuard roles={["admin"]}>
                          {u.user_id !== currentUser?.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteUserId(u.user_id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </RoleGuard>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Diaristas */}
          <TabsContent value="diaristas" className="mt-4 space-y-4">
            <RoleGuard roles={["admin"]}>
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setDiaristaCriarOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Diarista
                </Button>
              </div>
            </RoleGuard>
            {diaristasLoading ? (
              <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
            ) : diaristas.length === 0 ? (
              <EmptyState
                title="Nenhum diarista cadastrado"
                description="Adicione os trabalhadores diaristas do seu time."
                icon={<UserCog className="h-10 w-10" />}
              />
            ) : (
              <div className="space-y-2">
                {diaristas.map((d) => (
                  <Card key={d.id}>
                    <CardContent className="flex items-center justify-between py-4">
                      <div>
                        <p className="font-medium">{d.nome}</p>
                        {d.descricao && <p className="text-sm text-muted-foreground">{d.descricao}</p>}
                        {d.chave_pix && <p className="text-xs text-muted-foreground">PIX: {d.chave_pix}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-semibold">{formatCurrency(d.valor_diaria)}/dia</p>
                        <RoleGuard roles={["admin"]}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteDiaristaId(d.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </RoleGuard>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog convidar */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Convidar Membro</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmitInvite((v) => inviteMutation.mutate(v))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input type="email" placeholder="membro@empresa.com" {...registerInvite("email")} />
              {errorsInvite.email && <p className="text-xs text-destructive">{errorsInvite.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Função *</Label>
              <Select onValueChange={(v) => setValueInvite("role", v as InviteFormValues["role"])}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="engenheiro">Engenheiro</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="cliente">Cliente</SelectItem>
                  <SelectItem value="funcionario">UsuÃ¡rio comum</SelectItem>
                </SelectContent>
              </Select>
              {errorsInvite.role && <p className="text-xs text-destructive">{errorsInvite.role.message}</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setInviteOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={inviteMutation.isPending}>
                {inviteMutation.isPending ? "Enviando..." : "Enviar convite"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog criar diarista */}
      <Dialog open={diaristaCriarOpen} onOpenChange={setDiaristaCriarOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Diarista</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmitDiarista((v) => createDiaristaMutation.mutate(v))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input placeholder="José Pedreiro" {...registerDiarista("nome")} />
              {errorsDiarista.nome && <p className="text-xs text-destructive">{errorsDiarista.nome.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Descrição (opcional)</Label>
              <Input placeholder="Especialidade..." {...registerDiarista("descricao")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Valor da diária *</Label>
                <Input placeholder="250.00" {...registerDiarista("valor_diaria")} />
                {errorsDiarista.valor_diaria && <p className="text-xs text-destructive">{errorsDiarista.valor_diaria.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Chave PIX (opcional)</Label>
                <Input placeholder="chave@pix.com" {...registerDiarista("chave_pix")} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setDiaristaCriarOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createDiaristaMutation.isPending}>
                {createDiaristaMutation.isPending ? "Salvando..." : "Adicionar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmar remoção usuário */}
      <ConfirmDialog
        open={!!deleteUserId}
        onOpenChange={(o) => !o && setDeleteUserId(null)}
        title="Remover usuário"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Remover"
        variant="destructive"
        onConfirm={() => deleteUserId && deleteUserMutation.mutate(deleteUserId)}
        loading={deleteUserMutation.isPending}
      />

      {/* Confirmar remoção diarista */}
      <ConfirmDialog
        open={!!deleteDiaristaId}
        onOpenChange={(o) => !o && setDeleteDiaristaId(null)}
        title="Remover diarista"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Remover"
        variant="destructive"
        onConfirm={() => deleteDiaristaId && deleteDiaristaMutation.mutate(deleteDiaristaId)}
        loading={deleteDiaristaMutation.isPending}
      />
    </PageTransition>
  );
}
