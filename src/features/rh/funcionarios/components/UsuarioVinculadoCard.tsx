import { motion } from "framer-motion";
import { Mail, UserCheck, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { getInitials } from "@/lib/utils";
import type { RhFuncionario } from "@/types/rh.types";

type UsuarioVinculado = NonNullable<RhFuncionario["usuario_vinculado"]>;

function getSafeLinkedUser(funcionario: RhFuncionario): UsuarioVinculado | null {
  if (funcionario.usuario_vinculado?.nome || funcionario.usuario_vinculado?.email) {
    return funcionario.usuario_vinculado;
  }

  if (funcionario.usuario_nome || funcionario.usuario_email) {
    return {
      nome: funcionario.usuario_nome ?? "Usuario vinculado",
      email: funcionario.usuario_email ?? "Email nao informado",
      avatar_url: null,
    };
  }

  return null;
}

function safeAvatarUrl(value?: string | null) {
  if (!value) {
    return null;
  }

  try {
    if (value.startsWith("/")) {
      return value;
    }
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? value : null;
  } catch {
    return null;
  }
}

export function UsuarioVinculadoCard({ funcionario }: { funcionario: RhFuncionario }) {
  const usuario = getSafeLinkedUser(funcionario);
  const initials = getInitials(usuario?.nome ?? "Usuario");
  const avatarUrl = safeAvatarUrl(usuario?.avatar_url);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      <Card className="overflow-hidden transition-colors duration-200 hover:border-primary/40">
        <CardContent className="flex items-center gap-3 p-4">
          <Avatar className="size-12 border">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={usuario?.nome ?? "Usuario vinculado"} /> : null}
            <AvatarFallback>{usuario ? initials : <UserRound className="size-5" />}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <UserCheck className="size-4 text-primary" />
              <p className="text-sm font-medium">Usuario vinculado</p>
            </div>
            {usuario ? (
              <>
                <p className="truncate text-base font-semibold">{usuario.nome}</p>
                <p className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
                  <Mail className="size-3.5" />
                  {usuario.email}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Sem usuario vinculado</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
