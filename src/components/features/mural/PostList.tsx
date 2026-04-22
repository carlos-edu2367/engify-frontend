import { useEffect, useRef } from "react";
import { PostCard } from "./PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Send } from "lucide-react";
import type { MuralPostResponse } from "@/types/mural.types";

interface PostListProps {
  posts: MuralPostResponse[];
  hasNextPage: boolean;
  fetchNextPage: () => void;
  isFetchingNextPage: boolean;
  isLoading: boolean;
  currentUserId: string;
  currentUserRole: string;
  onDelete: (postId: string) => void;
  isDeleting: boolean;
}

export function PostList({
  posts,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
  isLoading,
  currentUserId,
  currentUserRole,
  onDelete,
  isDeleting,
}: PostListProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading && posts.length === 0) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-[24px]" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[28px] border border-dashed border-border/60 bg-muted/20 px-6 py-20 text-center animate-in fade-in zoom-in duration-500">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/5 text-primary/30 shadow-inner">
          <Send className="h-10 w-10 rotate-12" />
        </div>
        <h3 className="text-lg font-bold text-foreground/80">O mural está vazio</h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-[280px]">
          Seja o primeiro a compartilhar uma atualização ou imagem com a equipe.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          onDelete={onDelete}
          isDeleting={isDeleting}
        />
      ))}

      {/* Pagination Trigger */}
      {hasNextPage && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          {isFetchingNextPage && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Carregando mais publicações...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
