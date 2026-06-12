import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Link2, Mail, Pencil, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { rhService } from "@/services/rh.service";
import { usersService } from "@/services/users.service";
import { getApiErrorMessage } from "@/lib/utils";
import { rhQueryKeys } from "../../shared/utils/queryKeys";
import { UserSearchSelect } from "../../shared/components/UserSearchSelect";
import { UsuarioVinculadoCard } from "./UsuarioVinculadoCard";
import type { RhFuncionario } from "@/types/rh.types";
import type { UserResponse } from "@/types/user.types";

export function UsuarioVinculoEditor({ funcionario }: { funcionario: RhFuncionario }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");

  const linkMutation = useMutation({
    mutationFn: () => {
      if (!selectedUser) throw new Error("Selecione um usuario para vincular.");
      return rhService.update(funcionario.id, { user_id: selectedUser.user_id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rhQueryKeys.funcionarios.detail(funcionario.id) });
      queryClient.invalidateQueries({ queryKey: rhQueryKeys.funcionarios.all() });
      toast.success("Usuario vinculado com sucesso.");
      setOpen(false);
      setSelectedUser(null);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const inviteMutation = useMutation({
    mutationFn: () => {
      if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
        throw new Error("Informe um e-mail valido para o convite.");
      }
      return usersService.inviteFuncionario(inviteEmail.trim());
    },
    onSuccess: () => {
      toast.success(`Convite enviado para ${inviteEmail.trim()}.`);
      setInviteEmail("");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const hasUser = !!(funcionario.usuario_vinculado?.nome || funcionario.usuario_nome);

  return (
    <div className="flex flex-col gap-3">
      <UsuarioVinculadoCard funcionario={funcionario} />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() => {
          setSelectedUser(null);
          setInviteEmail("");
          inviteMutation.reset();
          setOpen(true);
        }}
      >
        {hasUser ? (
          <>
            <Pencil className="mr-2 size-3.5" />
            Alterar vinculo
          </>
        ) : (
          <>
            <Link2 className="mr-2 size-3.5" />
            Vincular usuario
          </>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Vincular usuario</DialogTitle>
            <DialogDescription>
              Busque um usuario existente com perfil Funcionario ou envie um convite para um novo usuario.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="buscar">
            <TabsList className="w-full">
              <TabsTrigger value="buscar" className="flex-1">Buscar existente</TabsTrigger>
              <TabsTrigger value="convidar" className="flex-1">Convidar novo</TabsTrigger>
            </TabsList>

            <TabsContent value="buscar" className="mt-4">
              <UserSearchSelect
                filterRole="funcionario"
                value={selectedUser}
                onChange={setSelectedUser}
              />
            </TabsContent>

            <TabsContent value="convidar" className="mt-4">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium">E-mail do novo usuario</span>
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="funcionario@empresa.com"
                  />
                  <span className="text-xs text-muted-foreground">
                    O convidado recebera um link com perfil Funcionario. Apos o cadastro, volte aqui para vincular.
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => inviteMutation.mutate()}
                  disabled={inviteMutation.isPending || !inviteEmail.trim()}
                  className="self-start"
                >
                  <Mail className="mr-2 size-4" />
                  {inviteMutation.isPending ? "Enviando..." : "Enviar convite"}
                </Button>
                {inviteMutation.isSuccess ? (
                  <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                    <UserPlus className="size-4 shrink-0" />
                    <span>Convite enviado. Vincule apos o cadastro do convidado.</span>
                  </div>
                ) : null}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => linkMutation.mutate()}
              disabled={!selectedUser || linkMutation.isPending}
            >
              {linkMutation.isPending ? "Vinculando..." : "Confirmar vinculo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
