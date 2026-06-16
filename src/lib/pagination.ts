import type { PaginatedResponse } from "@/types/api.types";

export function getNextPageParam<T>(lastPage: PaginatedResponse<T>): number | undefined {
  if (!lastPage.has_next || lastPage.items.length === 0) {
    return undefined;
  }
  return lastPage.page + 1;
}
