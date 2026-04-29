import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatCurrency } from "@/lib/utils";
import { rhService } from "@/services/rh.service";
import type { RhHolerite } from "@/types/rh.types";
import { HoleritesSection, QueueEmpty, statusLabel } from "../rh-shared";

export function EmployeePayslipsTab() {
  const [holeriteId, setHoleriteId] = useState<string | null>(null);

  const meusHoleritesQuery = useQuery({
    queryKey: ["rh-meus-holerites"],
    queryFn: () => rhService.listMyHolerites(1, 50),
  });

  const holeriteDetailQuery = useQuery({
    queryKey: ["rh-meu-holerite", holeriteId],
    queryFn: () => rhService.getMyHolerite(holeriteId!),
    enabled: !!holeriteId,
  });

  return (
    <div className="space-y-4">
      <HoleritesSection items={meusHoleritesQuery.data?.items ?? []} loading={meusHoleritesQuery.isLoading} />
      {meusHoleritesQuery.data?.items.length ? (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Wallet className="h-5 w-5" />
              Abrir detalhe
            </CardTitle>
            <CardDescription>Consulte os valores fechados de cada competencia.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {meusHoleritesQuery.data.items.map((item) => (
              <div key={item.id} className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">
                    {String(item.mes_referencia).padStart(2, "0")}/{item.ano_referencia}
                  </p>
                  <p className="text-sm text-muted-foreground">Liquido: {formatCurrency(item.valor_liquido)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setHoleriteId(item.id)}>
                    Ver detalhe
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Sheet open={!!holeriteId} onOpenChange={(open) => (!open ? setHoleriteId(null) : undefined)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Meu holerite</SheetTitle>
            <SheetDescription>Detalhe somente leitura do fechamento da competencia.</SheetDescription>
          </SheetHeader>
          {holeriteDetailQuery.isLoading ? (
            <div className="mt-6">
              <QueueEmpty text="Carregando detalhe do holerite..." />
            </div>
          ) : holeriteDetailQuery.data ? (
            <EmployeeHoleriteDetail item={holeriteDetailQuery.data} />
          ) : (
            <div className="mt-6">
              <QueueEmpty text="Nao foi possivel carregar esse holerite." />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function EmployeeHoleriteDetail({ item }: { item: RhHolerite }) {
  return (
    <div className="mt-6 space-y-4">
      <Card>
        <CardContent className="grid gap-3 py-4 md:grid-cols-2">
          <MiniStat label="Competencia" value={`${String(item.mes_referencia).padStart(2, "0")}/${item.ano_referencia}`} />
          <MiniStat label="Status" value={statusLabel(item.status)} />
          <MiniStat label="Salario base" value={formatCurrency(item.salario_base)} />
          <MiniStat label="Valor liquido" value={formatCurrency(item.valor_liquido)} />
          <MiniStat label="Horas extras" value={formatCurrency(item.horas_extras)} />
          <MiniStat label="Descontos por falta" value={formatCurrency(item.descontos_falta)} />
          <MiniStat label="Acrescimos manuais" value={formatCurrency(item.acrescimos_manuais)} />
          <MiniStat label="Descontos manuais" value={formatCurrency(item.descontos_manuais)} />
        </CardContent>
      </Card>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
