import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export interface MonthYearFilterProps {
  /** "" (todos os meses) ou "yyyy-MM". */
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/**
 * Seletor de mês de vencimento/movimentação — duas listas (mês e ano) em vez
 * de um <input type="month">, cujo comportamento de digitação/scroll varia
 * entre navegadores. O ano persiste localmente mesmo com "Todos os meses"
 * selecionado, para não se perder ao trocar de mês.
 */
export function MonthYearFilter({ value, onChange, className }: MonthYearFilterProps) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(() => (value ? Number(value.slice(0, 4)) : currentYear));

  useEffect(() => {
    if (value) setYear(Number(value.slice(0, 4)));
  }, [value]);

  const monthValue = value ? value.slice(5, 7) : "all";
  const years = Array.from({ length: 7 }, (_, i) => currentYear + 1 - i);

  function handleMonthChange(month: string) {
    onChange(month === "all" ? "" : `${year}-${month}`);
  }

  function handleYearChange(nextYear: string) {
    const y = Number(nextYear);
    setYear(y);
    if (monthValue !== "all") {
      onChange(`${y}-${monthValue}`);
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <Select value={monthValue} onValueChange={handleMonthChange}>
        <SelectTrigger className="h-9 w-36 text-xs" aria-label="Mês">
          <SelectValue placeholder="Mês" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os meses</SelectItem>
          {MONTH_NAMES.map((name, i) => (
            <SelectItem key={name} value={String(i + 1).padStart(2, "0")}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={String(year)} onValueChange={handleYearChange}>
        <SelectTrigger className="h-9 w-24 text-xs" aria-label="Ano">
          <SelectValue placeholder="Ano" />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
