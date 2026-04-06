import { useAuthStore } from "@/store/auth.store";
import { useMural } from "@/hooks/useMural";
import { PostComposer } from "./PostComposer";
import { PostList } from "./PostList";
import { storageService } from "@/services/storage.service";
import { muralService } from "@/services/mural.service";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

interface MuralTabProps {
  obraId: string;
}

export function MuralTab({ obraId }: MuralTabProps) {
  const user = useAuthStore((s) => s.user);
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

  async function handlePublish(content: string, mentions: string[], files: File[]) {
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
      }

      toast.success("Publicado no mural!");
    } catch (error) {
      console.error("Error publishing to mural:", error);
      toast.error("Erro ao publicar. Tente novamente.");
    }
  }

  return (
    <div className="mx-auto max-w-2xl animate-in space-y-8 fade-in duration-700 pb-36 md:pb-0">
      <div className="flex flex-col gap-1 px-1">
        <h2 className="text-2xl font-bold tracking-tight text-foreground/90">Mural da Equipe</h2>
        <p className="text-sm font-medium text-muted-foreground/80">
          Compartilhe atualizacoes, fotos ou documentos sobre a obra.
        </p>
      </div>

      <div className="hidden md:block">
        <PostComposer onPublish={handlePublish} isPublishing={isCreating} />
      </div>

      <Separator className="opacity-40" />

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

      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 backdrop-blur md:hidden">
        <div className="mx-auto w-full max-w-2xl px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2">
          <PostComposer
            onPublish={handlePublish}
            isPublishing={isCreating}
            mobileDocked
            className="shadow-lg"
          />
        </div>
      </div>
    </div>
  );
}
