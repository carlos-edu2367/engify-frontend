import { Badge } from "@/components/ui/badge";
import { statusBadgeVariant, statusLabel } from "../utils/formatters";

export function RhStatusBadge({ status }: { status?: string | null }) {
  return <Badge variant={statusBadgeVariant(status)}>{statusLabel(status)}</Badge>;
}
