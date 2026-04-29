import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { RhEmptyState } from "./RhEmptyState";
import { RhErrorState } from "./RhErrorState";
import { RhTableSkeleton } from "./RhTableSkeleton";

export type RhColumn<T> = {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
  className?: string;
};

export function RhDataTable<T>({
  items,
  columns,
  getRowKey,
  loading,
  error,
  emptyTitle,
  emptyDescription,
  page,
  hasNext,
  onPageChange,
  onRetry,
}: {
  items: T[];
  columns: RhColumn<T>[];
  getRowKey: (item: T) => string;
  loading?: boolean;
  error?: boolean;
  emptyTitle: string;
  emptyDescription: string;
  page?: number;
  hasNext?: boolean;
  onPageChange?: (page: number) => void;
  onRetry?: () => void;
}) {
  if (loading) {
    return <RhTableSkeleton rows={6} />;
  }

  if (error) {
    return <RhErrorState onRetry={onRetry} />;
  }

  if (!items.length) {
    return <RhEmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={column.className ?? "px-4 py-3 font-medium"}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={getRowKey(item)} className="border-t">
                {columns.map((column) => (
                  <td key={column.key} className={column.className ?? "px-4 py-3 align-middle"}>
                    {column.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {typeof page === "number" && onPageChange ? (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">Pagina {page}</span>
          <Button variant="outline" size="sm" disabled={!hasNext} onClick={() => onPageChange(page + 1)}>
            Proxima
          </Button>
        </div>
      ) : null}
    </div>
  );
}
