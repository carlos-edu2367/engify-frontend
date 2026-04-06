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
  const parts = content.split(/(@[\p{L}\p{N}_]+)/gu);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("@")) {
          const display = part.replace(/_/g, " ");
          return (
            <span key={i} className="cursor-default font-semibold text-primary/80 hover:underline">
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
      className="group flex gap-3 rounded-2xl border border-border/50 bg-card p-4 shadow-sm transition-all hover:border-border/80 hover:shadow-md md:gap-3.5 md:p-5"
    >
      <div className="flex h-9 w-9 shrink-0 select-none items-center justify-center overflow-hidden rounded-full border border-primary/10 bg-gradient-to-br from-primary/10 to-primary/20 shadow-inner md:h-10 md:w-10">
        <span className="text-xs font-bold tracking-wider text-primary">
          {getInitials(post.author_nome ?? undefined)}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-0.5 md:flex-row md:items-center md:gap-2">
            <span className="truncate text-sm font-bold text-foreground/90">
              {post.author_nome ?? "Usuario removido"}
            </span>
            <span className="select-none text-[10px] uppercase tracking-wider text-muted-foreground/60">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
            </span>
          </div>

          {canDelete && (
            <button
              onClick={() => onDelete(post.id)}
              disabled={isDeleting}
              className="rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50 md:opacity-0 md:group-hover:opacity-100"
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

        <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/80">
          <HighlightMentions content={post.content} />
        </p>

        <AttachmentList attachments={post.attachments} />
      </div>
    </motion.div>
  );
}
