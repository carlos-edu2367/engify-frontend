import { useAuthStore } from "@/store/auth.store";
import { useMural, useMuralAttachments } from "@/hooks/useMural";
import { PostComposer } from "./PostComposer";
import { PostList } from "./PostList";
import { storageService } from "@/services/storage.service";
import { muralService } from "@/services/mural.service";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Files, MessageSquare, Paperclip } from "lucide-react";
import { useState } from "react";
import { MuralAttachmentsSheet } from "./MuralAttachmentsSheet";

interface MuralTabProps {
  obraId: string;
}

export function MuralTab({ obraId }: MuralTabProps) {
  const user = useAuthStore((s) => s.user);
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const {
    posts,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    createPost,
    deletePost,
    isCreating,
    isDeleting,
    refresh,
  } = useMural(obraId);
  const {
    attachments,
    isLoading: isLoadingAttachments,
    refresh: refreshAttachments,
  } = useMuralAttachments(obraId);

  async function handlePublish(content: string, mentions: string[], files: File[]) {
    if (!content.trim()) {
      toast.error("Escreva uma mensagem para publicar no mural.");
      return;
    }

    try {
      const post = await createPost({ content, mentions });

      if (files.length > 0) {
        const uploadPromises = files.map(async (file) => {
          const path = await storageService.upload("mural", post.id, file);
          return muralService.addAttachment(obraId, post.id, {
            file_path: path,
            file_name: file.name,
            content_type: file.type,
          });
        });

        await Promise.all(uploadPromises);
        refresh();
        refreshAttachments();
      }

      toast.success("Publicado no mural!");
    } catch (error) {
      console.error("Error publishing to mural:", error);
      toast.error("Erro ao publicar. Tente novamente.");
    }
  }

  return (
    <div className="mx-auto max-w-4xl animate-in space-y-6 fade-in duration-700">
      <section className="overflow-hidden rounded-[30px] border border-border/60 bg-gradient-to-br from-card via-card to-muted/30 shadow-sm">
        <div className="flex flex-col gap-5 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">
                <MessageSquare className="h-3.5 w-3.5" />
                Comunicacao da obra
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground/90">Mural da Equipe</h2>
                <p className="text-sm font-medium leading-6 text-muted-foreground/80">
                  O composer fica no topo para facilitar atualizacoes rapidas no mobile, com anexos,
                  mencoes e historico logo abaixo.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full gap-2 self-start rounded-2xl sm:w-auto"
              onClick={() => setAttachmentsOpen(true)}
            >
              <Files className="h-4 w-4" />
              Documentos do mural
              <Badge variant="secondary" className="ml-1">
                {isLoadingAttachments ? "..." : attachments.length}
              </Badge>
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Publicacoes
              </p>
              <p className="mt-2 text-2xl font-bold text-foreground">{posts.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Atualizacoes compartilhadas pela equipe.</p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Anexos
              </p>
              <p className="mt-2 text-2xl font-bold text-foreground">{isLoadingAttachments ? "..." : attachments.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Fotos, documentos e comprovantes do mural.</p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Fluxo
              </p>
              <div className="mt-2 flex items-center gap-2 text-foreground">
                <Paperclip className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Mensagem + anexo + mencao</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Tudo disponivel sem barra fixa no rodape.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="sticky top-3 z-10">
        <PostComposer onPublish={handlePublish} isPublishing={isCreating} className="border-primary/10 shadow-lg" />
      </div>

      <Separator className="opacity-40" />

      <section className="rounded-[28px] border border-border/60 bg-card/70 p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-foreground">Historico do mural</h3>
            <p className="text-sm text-muted-foreground">As publicacoes mais recentes aparecem primeiro.</p>
          </div>
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            {posts.length} post{posts.length !== 1 ? "s" : ""}
          </Badge>
        </div>
        <PostList
          posts={posts}
          isLoading={isLoading}
          hasNextPage={hasNextPage}
          fetchNextPage={fetchNextPage}
          isFetchingNextPage={isFetchingNextPage}
          currentUserId={user?.id ?? ""}
          currentUserRole={user?.role ?? ""}
          onDelete={(id) => deletePost(id)}
          isDeleting={isDeleting}
        />
      </section>

      <MuralAttachmentsSheet
        open={attachmentsOpen}
        onOpenChange={setAttachmentsOpen}
        attachments={attachments}
        isLoading={isLoadingAttachments}
      />
    </div>
  );
}
