import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { classeLabels } from "@/lib/financeiro-labels";
import type { CustoPorClasse } from "@/types/obra-financeiro.types";

interface CustosPorClasseProps {
  itens: CustoPorClasse[] | undefined;
  isLoading: boolean;
}

export function CustosPorClasse({ itens, isLoading }: CustosPorClasseProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Custo por classe</h3>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!itens || itens.length === 0) return null;

  const maxTotal = Math.max(
    ...itens.map((i) => Number(i.realizado) + Number(i.comprometido)),
    1,
  );

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Custo por classe</h3>
      <div className="space-y-3">
        {itens.map((item) => {
          const realizado = Number(item.realizado);
          const comprometido = Number(item.comprometido);
          const total = realizado + comprometido;
          const larguraPct = (total / maxTotal) * 100;
          const realizadoPct = total > 0 ? (realizado / total) * 100 : 0;
          const comprometidoPct = total > 0 ? (comprometido / total) * 100 : 0;

          return (
            <div key={item.classe} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground">
                  {classeLabels[item.classe]}
                </span>
                <span className="tabular-nums font-semibold">{formatCurrency(total)}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${larguraPct}%` }}
                  transition={{ type: "spring", damping: 20, stiffness: 100 }}
                  className="h-full flex"
                >
                  <div
                    style={{ width: `${realizadoPct}%` }}
                    className="h-full bg-primary"
                    title={`Realizado: ${formatCurrency(realizado)}`}
                  />
                  <div
                    style={{ width: `${comprometidoPct}%` }}
                    className="h-full bg-primary/40"
                    title={`Comprometido: ${formatCurrency(comprometido)}`}
                  />
                </motion.div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
