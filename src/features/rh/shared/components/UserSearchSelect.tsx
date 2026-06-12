import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usersService } from "@/services/users.service";
import type { Role } from "@/types/auth.types";
import type { UserResponse } from "@/types/user.types";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

function formatCpf(cpf?: string) {
  if (!cpf) return "";
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return cpf;
  return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
}

export function UserSearchSelect({
  value,
  onChange,
  filterRole,
}: {
  value?: UserResponse | null;
  onChange: (user: UserResponse | null) => void;
  filterRole?: Role;
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
    const cleanTerm = term.replace(/\D/g, "");

    return (query.data ?? [])
      .filter((user) => !filterRole || user.role === filterRole)
      .filter((user) => {
        if (!term) return true;
        const nameMatch = user.nome.toLowerCase().includes(term);
        const emailMatch = user.email.toLowerCase().includes(term);
        
        const userCpf = user.cpf ?? "";
        const cleanUserCpf = userCpf.replace(/\D/g, "");
        const cpfMatch = cleanTerm.length > 0 && cleanUserCpf.includes(cleanTerm);
        const formattedCpfMatch = userCpf.toLowerCase().includes(term);

        return nameMatch || emailMatch || cpfMatch || formattedCpfMatch;
      })
      .slice(0, 20);
  }, [debouncedSearch, filterRole, query.data]);

  return (
    <div className="flex flex-col gap-2">
      <label className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar usuario por nome, email ou CPF"
          className="pl-9"
          aria-label="Buscar usuario por nome, email ou CPF"
        />
      </label>
      {value ? (
        <div className="flex items-center justify-between rounded-md border bg-muted/30 p-2 text-sm">
          <div>
            <p className="font-medium">{value.nome}</p>
            <p className="text-xs text-muted-foreground">
              {value.email}
              {value.cpf ? ` • CPF: ${formatCpf(value.cpf)}` : ""}
            </p>
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
            <div className="flex gap-2 text-xs text-muted-foreground">
              <span>{user.email}</span>
              {user.cpf ? (
                <>
                  <span>•</span>
                  <span>CPF: {formatCpf(user.cpf)}</span>
                </>
              ) : null}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
