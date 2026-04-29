import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function SensitiveValue({
  value,
  masked = "******",
  canReveal = false,
}: {
  value: string;
  masked?: string;
  canReveal?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const shouldShow = canReveal && visible;

  return (
    <span className="inline-flex items-center gap-2">
      <span>{shouldShow ? value : masked}</span>
      {canReveal ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={() => setVisible((current) => !current)}
          aria-label={shouldShow ? "Mascarar valor sensivel" : "Mostrar valor sensivel"}
        >
          {shouldShow ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </Button>
      ) : null}
    </span>
  );
}
