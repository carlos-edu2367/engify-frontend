import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RhHoleriteItem, RhHoleriteItemNatureza, RhHoleriteSnapshot } from "@/types/rh.types";
import { formatRhCurrency, statusLabel } from "../utils/formatters";

const groups: Array<{ key: RhHoleriteItemNatureza; title: string }> = [
  { key: "provento", title: "Proventos" },
  { key: "desconto", title: "Descontos" },
  { key: "informativo", title: "Informativos" },
];

export function HoleriteBreakdown({
  items,
  snapshots,
  loading,
  onLoadSnapshot,
}: {
  items: RhHoleriteItem[];
  snapshots: Record<string, RhHoleriteSnapshot | undefined>;
  loading?: boolean;
  onLoadSnapshot: (item: RhHoleriteItem) => void;
}) {
  const [openItemId, setOpenItemId] = useState<string | null>(null);

  if (loading) {
    return <p className="rounded-md border p-3 text-sm text-muted-foreground">Carregando itens do holerite...</p>;
  }

  if (!items.length) {
    return <p className="rounded-md border p-3 text-sm text-muted-foreground">Itens detalhados ainda nao retornados para este holerite.</p>;
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const groupedItems = items.filter((item) => item.natureza === group.key);
        return (
          <section key={group.key} className="rounded-md border">
            <div className="border-b p-3 font-medium">{group.title}</div>
            {groupedItems.length === 0 ? <p className="p-3 text-sm text-muted-foreground">Sem itens.</p> : null}
            {groupedItems.map((item) => {
              const open = openItemId === item.id;
              const snapshot = snapshots[item.id];
              return (
                <div key={item.id} className="border-b p-3 last:border-b-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.descricao}</p>
                      <p className="text-xs text-muted-foreground">
                        Origem {statusLabel(item.origem)} · Regra {item.regra_nome ?? "Nao vinculada"} · Versao {item.regra_versao ?? "-"}
                      </p>
                      <p className="text-xs text-muted-foreground">Base: {item.base_calculo ?? "Nao informada"}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatRhCurrency(item.valor)}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setOpenItemId(open ? null : item.id);
                          if (!open && !snapshot) onLoadSnapshot(item);
                        }}
                      >
                        {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                        Calculo
                      </Button>
                    </div>
                  </div>
                  {open ? (
                    <div className="mt-3 rounded-md bg-muted/40 p-3 text-sm">
                      {snapshot?.linhas?.length ? (
                        <dl className="space-y-2">
                          {snapshot.linhas.map((line) => (
                            <div key={line.label} className="flex justify-between gap-3">
                              <dt className="text-muted-foreground">{line.label}</dt>
                              <dd className="font-medium">{line.value}</dd>
                            </div>
                          ))}
                        </dl>
                      ) : (
                        <p>{item.calculation_summary ?? "Calculo detalhado sera carregado sob demanda quando o backend retornar snapshot permitido."}</p>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
