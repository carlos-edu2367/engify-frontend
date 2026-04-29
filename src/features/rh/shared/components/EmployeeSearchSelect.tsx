import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { rhService } from "@/services/rh.service";
import type { RhFuncionarioListItem } from "@/types/rh.types";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { employeeDisplay } from "../utils/display";
import { rhQueryKeys } from "../utils/queryKeys";

export function EmployeeSearchSelect({
  value,
  onChange,
  placeholder = "Buscar funcionario por nome, cargo ou CPF",
}: {
  value?: RhFuncionarioListItem | null;
  onChange: (employee: RhFuncionarioListItem | null) => void;
  placeholder?: string;
}) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);

  const query = useQuery({
    queryKey: rhQueryKeys.funcionarios.list({ page: 1, limit: 20, search: debouncedSearch, isActive: true }),
    queryFn: () => rhService.list(1, 20, debouncedSearch || undefined, true),
    staleTime: 60_000,
  });

  const items = query.data?.items ?? [];
  const selected = employeeDisplay(value);

  return (
    <div className="flex flex-col gap-2">
      <label className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={placeholder}
          className="pl-9"
          aria-label={placeholder}
        />
      </label>
      {value ? (
        <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 p-2 text-sm">
          <div>
            <p className="font-medium">{selected.title}</p>
            <p className="text-xs text-muted-foreground">{selected.subtitle}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={() => onChange(null)} aria-label="Limpar funcionario">
            <X className="size-4" />
          </Button>
        </div>
      ) : null}
      <div className="max-h-48 overflow-y-auto rounded-md border">
        {query.isLoading ? <p className="p-3 text-sm text-muted-foreground">Buscando funcionarios...</p> : null}
        {query.isError ? <p className="p-3 text-sm text-destructive">Nao foi possivel buscar funcionarios.</p> : null}
        {!query.isLoading && !query.isError && items.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground">Nenhum funcionario encontrado.</p>
        ) : null}
        {items.map((employee) => {
          const display = employeeDisplay(employee);
          return (
            <button
              key={employee.id}
              type="button"
              className="flex w-full flex-col items-start border-b p-3 text-left text-sm last:border-b-0 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => {
                onChange(employee);
                setSearch("");
              }}
            >
              <span className="font-medium">{display.title}</span>
              <span className="text-xs text-muted-foreground">{display.subtitle}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
