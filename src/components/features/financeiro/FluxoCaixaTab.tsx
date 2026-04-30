import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Calendar,
  AlertCircle,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { financeiroService } from "@/services/financeiro.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";


export function FluxoCaixaTab() {
  const [range, setRange] = useState("6m");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["financeiro", "fluxo-caixa", range],
    queryFn: () => financeiroService.getFluxoCaixa(range),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const chartData = useMemo(() => {
    if (!data?.dados || data.dados.length === 0) return [];
    
    // Sort by month (YYYY-MM)
    return [...data.dados].sort((a, b) => a.mes.localeCompare(b.mes));
  }, [data]);

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-destructive/10 p-3 rounded-full mb-4">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold">Erro ao carregar fluxo de caixa</h3>
        <p className="text-muted-foreground mb-4">Não foi possível carregar os dados financeiros no momento.</p>
        <button 
          onClick={() => refetch()}
          className="text-primary hover:underline font-medium"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtro e Título */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Fluxo de Caixa</h2>
          <p className="text-sm text-muted-foreground">Visão geral de entradas, saídas e saldo mensal.</p>
        </div>
        <div className="w-full sm:w-48">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger>
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6m">Últimos 6 meses</SelectItem>
              <SelectItem value="12m">Último ano</SelectItem>
              <SelectItem value="24m">Últimos 2 anos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <TrendingUp className="h-12 w-12 text-emerald-500" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Entradas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-bold text-emerald-600 dark:text-emerald-400"
              >
                {formatCurrency(data?.resumo.total_entradas || 0)}
              </motion.p>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <TrendingDown className="h-12 w-12 text-destructive" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Saídas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-bold text-destructive"
              >
                {formatCurrency(data?.resumo.total_saidas || 0)}
              </motion.p>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-primary/20 bg-primary/5">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Wallet className="h-12 w-12 text-primary" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Saldo Total</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-2xl font-bold ${(data?.resumo.saldo_total || 0) >= 0 ? "text-primary" : "text-destructive"}`}
              >
                {formatCurrency(data?.resumo.saldo_total || 0)}
              </motion.p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gráfico Principal */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-medium">Evolução Mensal</CardTitle>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-emerald-500" />
              <span>Entradas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-destructive" />
              <span>Saídas</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="h-[300px] w-full relative">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/20 rounded-lg animate-pulse">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                <p>Nenhum dado disponível para este período.</p>
              </div>
            ) : (
              <CashFlowChart data={chartData} />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Custom SVG Chart ────────────────────────────────────────────────────────

interface CashFlowChartProps {
  data: any[];
}

function CashFlowChart({ data }: CashFlowChartProps) {
  const maxValue = useMemo(() => {
    const max = Math.max(...data.map(d => Number(d.total_entradas) + Number(d.total_saidas)));
    return max === 0 ? 1000 : max * 1.1; 
  }, [data]);

  return (
    <div className="w-full h-full flex flex-col justify-end pt-8 relative">
      <div className="flex-1 flex items-stretch justify-center gap-4 sm:gap-8 px-2">
        {data.map((d, i) => {
          const entradas = Number(d.total_entradas);
          const saidas = Number(d.total_saidas);
          const total = entradas + saidas;
          const totalHeight = (total / maxValue) * 100;
          const entradaPart = total > 0 ? (entradas / total) * 100 : 0;
          const saidaPart = total > 0 ? (saidas / total) * 100 : 0;

          return (
            <div key={i} className="flex-1 max-w-[60px] flex flex-col items-center justify-end gap-2 group relative h-full">
              {/* Stacked Bar Container */}
              <div className="w-full flex flex-col items-center justify-end flex-1 min-h-[200px]">
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: `${Math.max(totalHeight, 4)}%`, opacity: 1 }}
                  transition={{ type: "spring", damping: 20, stiffness: 100, delay: i * 0.1 }}
                  className="w-full flex flex-col overflow-hidden rounded-t-md shadow-lg border border-white/5"
                >
                  {/* Entradas (Green) - Top */}
                  <div 
                    style={{ height: `${entradaPart}%` }}
                    className="w-full bg-emerald-500/90 hover:bg-emerald-500 transition-colors cursor-pointer"
                    title={`Entradas: ${formatCurrency(d.total_entradas)}`}
                  />
                  {/* Saídas (Red) - Bottom */}
                  <div 
                    style={{ height: `${saidaPart}%` }}
                    className="w-full bg-destructive/80 hover:bg-destructive transition-colors cursor-pointer border-t border-black/10"
                    title={`Saídas: ${formatCurrency(d.total_saidas)}`}
                  />
                </motion.div>
              </div>

              {/* Month Label */}
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter truncate w-full text-center mt-2">
                {formatMonthLabel(d.mes)}
              </div>
              
              {/* Tooltip */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-card border shadow-2xl rounded-lg p-2 z-30 opacity-0 group-hover:opacity-100 pointer-events-none transition-all scale-90 group-hover:scale-100 min-w-[140px]">
                <div className="text-[10px] font-black uppercase mb-1 border-b pb-1 text-center">{formatMonthLabelLong(d.mes)}</div>
                <div className="flex justify-between items-center gap-4">
                  <span className="text-[10px] text-emerald-500 font-bold">Entradas:</span>
                  <span className="text-[10px] font-mono">{formatCurrency(d.total_entradas)}</span>
                </div>
                <div className="flex justify-between items-center gap-4">
                  <span className="text-[10px] text-destructive font-bold">Saídas:</span>
                  <span className="text-[10px] font-mono">{formatCurrency(d.total_saidas)}</span>
                </div>
                <div className="flex justify-between items-center gap-4 border-t mt-1 pt-1">
                  <span className="text-[10px] font-bold">Saldo:</span>
                  <span className={`text-[10px] font-mono font-bold ${d.total_entradas - d.total_saidas >= 0 ? "text-primary" : "text-destructive"}`}>
                    {formatCurrency(d.total_entradas - d.total_saidas)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Y-Axis helper lines */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between pt-8 pb-10 px-2 opacity-20">
        {[1, 0.75, 0.5, 0.25].map((p, i) => (
          <div key={i} className="w-full border-t border-dashed border-muted-foreground flex justify-end">
            <span className="text-[8px] -mt-3 bg-background px-1">{formatCurrencyShort(p * maxValue)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
      
function formatMonthLabelLong(mesStr: string) {
  const [year, month] = mesStr.split('-');
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  return `${months[parseInt(month) - 1]} ${year}`;
}

function formatCurrencyShort(val: number) {
  if (val >= 1000000) return `R$ ${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `R$ ${(val / 1000).toFixed(0)}k`;
  return `R$ ${val.toFixed(0)}`;
}

function formatMonthLabel(mesStr: string) {
  const [year, month] = mesStr.split('-');
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${months[parseInt(month) - 1]} ${year.slice(2)}`;
}
