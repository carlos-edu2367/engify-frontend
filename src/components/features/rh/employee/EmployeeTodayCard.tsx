import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDuracao } from "@/features/rh/shared/utils/formatters";
import type { RhPontoHoje } from "@/types/rh.types";

function formatHora(value: string | null | undefined): string {
  if (!value) {
    return "--:--";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(date);
}

function tipoLabel(tipo: string): string {
  return tipo === "entrada" ? "entrada" : "saída";
}

export function EmployeeTodayCard({ hoje }: { hoje?: RhPontoHoje | null }) {
  if (!hoje) {
    return null;
  }

  if (!hoje.tem_expediente) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Clock className="h-5 w-5" />
            Hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Você não tem expediente hoje.</p>
        </CardContent>
      </Card>
    );
  }

  const batidas = Array.isArray(hoje.batidas) ? hoje.batidas : [];

  const resumo = hoje.jornada_aberta
    ? "Jornada em aberto"
    : hoje.minutos_trabalhados != null
      ? `Trabalhado hoje: ${formatDuracao(hoje.minutos_trabalhados)}`
      : "Nenhum registro hoje ainda";

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Clock className="h-5 w-5" />
          Hoje
        </CardTitle>
        <CardDescription>{resumo}</CardDescription>
      </CardHeader>
      <CardContent>
        {batidas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum registro hoje ainda.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {batidas.map((batida, index) => (
              <Badge key={batida.timestamp ?? index} variant="secondary">
                {formatHora(batida.timestamp)} {tipoLabel(batida.tipo)}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
