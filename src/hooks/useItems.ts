import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { itemsService } from "@/services/items.service";
import type { CreateItemRequest, UpdateItemRequest } from "@/types/item.types";

export function useItems(obraId: string | undefined) {
  return useQuery({
    queryKey: ["obras", obraId, "items"],
    queryFn: () => itemsService.list(obraId!),
    enabled: !!obraId,
  });
}

export function useCreateItem(obraId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateItemRequest) => itemsService.create(obraId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["obras", obraId, "items"] }),
  });
}

export function useUpdateItem(obraId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: UpdateItemRequest }) =>
      itemsService.update(obraId, itemId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["obras", obraId, "items"] }),
  });
}

export function useDeleteItem(obraId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => itemsService.delete(obraId, itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["obras", obraId, "items"] }),
  });
}
