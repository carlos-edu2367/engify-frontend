import { describe, expect, it } from "vitest";
import { getNextPageParam } from "./pagination";
import type { PaginatedResponse } from "@/types/api.types";

function page<T>(items: T[], page: number, total: number, limit = 50): PaginatedResponse<T> {
  return { items, page, limit, total, has_next: page * limit < total };
}

describe("getNextPageParam", () => {
  it("returns the next page number when has_next is true", () => {
    const lastPage = page([1, 2, 3], 1, 120);
    expect(getNextPageParam(lastPage)).toBe(2);
  });

  it("returns undefined when has_next is false", () => {
    const lastPage = page([1, 2, 3], 3, 120);
    expect(getNextPageParam(lastPage)).toBeUndefined();
  });

  it("returns undefined when the page has no items", () => {
    const lastPage = page([], 1, 0);
    expect(getNextPageParam(lastPage)).toBeUndefined();
  });
});
