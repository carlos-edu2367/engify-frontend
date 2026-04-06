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
    refresh
  } = useMural(obraId);

  async function handlePublish(content: string, mentions: string[], files: File[]) {
    try {
      // 1. Create Post
      const post = await createPost({ content, mentions });

      // 2. Upload and Register Attachments
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
        // Refresh to show attachments
        refresh();
      }

      toast.success("Publicado no mural!");
    } catch (error) {
      console.error("Error publishing to mural:", error);
      toast.error("Erro ao publicar. Tente novamente.");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-1 px-1">
        <h2 className="text-2xl font-bold tracking-tight text-foreground/90 flex items-center gap-3">
          <span className="text-3xl">📢</span> Mural da Equipe
        </h2>
        <p className="text-sm text-muted-foreground/80 font-medium">
          Compartilhe atualizações, fotos ou documentos sobre a obra.
        </p>
      </div>

      <PostComposer onPublish={handlePublish} isPublishing={isCreating} />

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
    </div>
  );
}
