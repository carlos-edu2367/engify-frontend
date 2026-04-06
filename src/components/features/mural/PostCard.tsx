import { Trash2, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AttachmentList } from "./AttachmentList";
import type { MuralPostResponse } from "@/types/mural.types";
import { motion } from "framer-motion";

interface PostCardProps {
  post: MuralPostResponse;
  currentUserId: string;
  currentUserRole: string;
  onDelete: (postId: string) => void;
  isDeleting: boolean;
}

function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function HighlightMentions({ content }: { content: string }) {
  // Menções são inseridas no formato @Nome_Sobrenome (underscores para nomes compostos)
  // A regex captura @ seguido de letras Unicode, números e underscores
  const parts = content.split(/(@[\p{L}\p{N}_]+)/gu);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("@")) {
          // Exibe com espaços no lugar dos underscores: @João_Silva → @João Silva
          const display = part.replace(/_/g, " ");
          return (
            <span key={i} className="font-semibold text-primary/80 hover:underline cursor-default">
              {display}
            </span>
          );
        }
        return part;
      })}
    </>
  );
}

export function PostCard({
  post,
  currentUserId,
  currentUserRole,
  onDelete,
  isDeleting,
}: PostCardProps) {
  const canDelete =
    currentUserRole?.toUpperCase() === "ADMIN" ||
    (!!post.author_id && post.author_id === currentUserId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group flex gap-3.5 rounded-2xl border border-border/50 bg-card p-5 shadow-sm transition-all hover:border-border/80 hover:shadow-md"
    >
      {/* Avatar */}
      <div className="h-10 w-10 shrink-0 select-none overflow-hidden rounded-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center border border-primary/10 shadow-inner">
        <span className="text-xs font-bold text-primary tracking-wider">
          {getInitials(post.author_nome ?? undefined)}
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground/90">
              {post.author_nome ?? "Usuário removido"}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 select-none">
              • {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
            </span>
          </div>

          {canDelete && (
            <button
              onClick={() => onDelete(post.id)}
              disabled={isDeleting}
              className="opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Remover post"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          )}
        </div>

        <p className="mt-1.5 text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap break-words">
          <HighlightMentions content={post.content} />
        </p>

        <AttachmentList attachments={post.attachments} />
      </div>
    </motion.div>
  );
}
