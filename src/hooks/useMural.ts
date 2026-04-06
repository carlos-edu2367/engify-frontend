import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { muralService } from "@/services/mural.service";
import { toast } from "sonner";
import type { CreateMuralPostRequest } from "@/types/mural.types";

export function useMural(obraId: string) {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: ["obras", obraId, "mural"],
    queryFn: ({ pageParam = 1 }) =>
      muralService.list(obraId, { page: pageParam as number, limit: 15 }),
    getNextPageParam: (last) => (last.has_next ? last.page + 1 : undefined),
    initialPageParam: 1,
    enabled: !!obraId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateMuralPostRequest) => muralService.create(obraId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obras", obraId, "mural"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (postId: string) => muralService.delete(obraId, postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obras", obraId, "mural"] });
      toast.success("Post removido.");
    },
    onError: () => toast.error("Erro ao remover post."),
  });

  const posts = query.data?.pages.flatMap((p) => p.items) ?? [];

  return {
    posts,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    createPost: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    deletePost: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    refresh: () => queryClient.invalidateQueries({ queryKey: ["obras", obraId, "mural"] }),
  };
}
