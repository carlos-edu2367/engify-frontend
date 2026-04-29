import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usersService } from "@/services/users.service";
import type { UserResponse } from "@/types/user.types";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

export function UserSearchSelect({
  value,
  onChange,
}: {
  value?: UserResponse | null;
  onChange: (user: UserResponse | null) => void;
}) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);
  const query = useQuery({
    queryKey: ["users", "search"],
    queryFn: () => usersService.list(),
    staleTime: 120_000,
  });

  const items = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    return (query.data ?? [])
      .filter((user) => !term || `${user.nome} ${user.email}`.toLowerCase().includes(term))
      .slice(0, 20);
  }, [debouncedSearch, query.data]);

  return (
    <div className="flex flex-col gap-2">
      <label className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar usuario por nome ou email"
          className="pl-9"
          aria-label="Buscar usuario por nome ou email"
        />
      </label>
      {value ? (
        <div className="flex items-center justify-between rounded-md border bg-muted/30 p-2 text-sm">
          <div>
            <p className="font-medium">{value.nome}</p>
            <p className="text-xs text-muted-foreground">{value.email}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={() => onChange(null)} aria-label="Remover usuario">
            <X className="size-4" />
          </Button>
        </div>
      ) : null}
      <div className="max-h-48 overflow-y-auto rounded-md border">
        {query.isLoading ? <p className="p-3 text-sm text-muted-foreground">Buscando usuarios...</p> : null}
        {query.isError ? <p className="p-3 text-sm text-destructive">Nao foi possivel buscar usuarios.</p> : null}
        {!query.isLoading && !query.isError && items.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground">Nenhum usuario encontrado.</p>
        ) : null}
        {items.map((user) => (
          <button
            key={user.user_id}
            type="button"
            className="flex w-full flex-col items-start border-b p-3 text-left text-sm last:border-b-0 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => {
              onChange(user);
              setSearch("");
            }}
          >
            <span className="font-medium">{user.nome}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
