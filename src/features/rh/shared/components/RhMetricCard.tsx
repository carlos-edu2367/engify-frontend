import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

export function RhMetricCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
          {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
        </div>
        {icon ? <div className="rounded-md bg-muted p-2 text-muted-foreground">{icon}</div> : null}
      </CardContent>
    </Card>
  );
}
