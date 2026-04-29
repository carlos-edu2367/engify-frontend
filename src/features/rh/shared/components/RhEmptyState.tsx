import type { ReactNode } from "react";
import { EmptyState } from "@/components/shared/EmptyState";

export function RhEmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
}) {
  return <EmptyState title={title} description={description} icon={icon} />;
}
