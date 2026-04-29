import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { RhFuncionarioListItem } from "@/types/rh.types";
import { PermissionGate } from "../../shared/components/PermissionGate";
import { RhDataTable, type RhColumn } from "../../shared/components/RhDataTable";
import { RhPageHeader } from "../../shared/components/RhPageHeader";
import { RhStatusBadge } from "../../shared/components/RhStatusBadge";
import { SensitiveValue } from "../../shared/components/SensitiveValue";
import { useDebouncedValue } from "../../shared/hooks/useDebouncedValue";
import { useRhPermission } from "../../shared/hooks/useRhPermission";
import { maskCpf } from "../../shared/utils/formatters";
import { rhPaths } from "../../shared/utils/paths";
import { useFuncionarios } from "../hooks/useFuncionarios";

type StatusFilter = "all" | "active" | "inactive";

export function FuncionariosPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("active");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);
  const { can } = useRhPermission();

  const isActive = status === "all" ? undefined : status === "active";
  const funcionariosQuery = useFuncionarios({
    page,
    limit: 20,
    search: debouncedSearch,
    isActive,
  });

  const columns = useMemo<Array<RhColumn<RhFuncionarioListItem>>>(
    () => [
      {
        key: "nome",
        header: "Nome",
        render: (item) => (
          <div>
              <Link to={rhPaths.funcionarioDetail(item.id)} className="font-medium hover:underline">
              {item.nome}
            </Link>
            <p className="text-xs text-muted-foreground">
              <SensitiveValue value={item.cpf_mascarado || maskCpf("")} masked={item.cpf_mascarado || maskCpf("")} />
            </p>
          </div>
        ),
      },
      { key: "cargo", header: "Cargo", render: (item) => item.cargo },
      { key: "status", header: "Status", render: (item) => <RhStatusBadge status={item.is_active ? "ativo" : "inativo"} /> },
      { key: "jornada", header: "Jornada", render: () => "Ver detalhe" },
      { key: "usuario", header: "Usuario", render: (item) => item.usuario_nome ?? (item.user_id ? "Usuario vinculado" : "Sem vinculo") },
      {
        key: "actions",
        header: "Acoes",
        render: (item) => (
          <Button variant="outline" size="sm" asChild>
            <Link to={rhPaths.funcionarioDetail(item.id)}>Detalhe</Link>
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <PermissionGate permission="rh.funcionarios.view" showDeniedState>
      <div className="flex flex-col gap-6">
        <RhPageHeader
          title="Funcionarios"
          description="Cadastros, contratos e jornadas com dados sensiveis preservados por padrao."
          actions={
            can("rh.funcionarios.create") ? (
              <Button asChild>
                <Link to={rhPaths.novoFuncionario}>
                  <Plus className="size-4" />
                  Novo funcionario
                </Link>
              </Button>
            ) : null
          }
        />

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Users className="size-5" />
              Lista de funcionarios
            </CardTitle>
            <CardDescription>Busca paginada com CPF mascarado e dados sensiveis preservados por padrao.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <label className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Buscar por nome, cargo ou CPF"
                  className="pl-9"
                />
              </label>
              <Select
                value={status}
                onValueChange={(value: StatusFilter) => {
                  setStatus(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <RhDataTable
              items={funcionariosQuery.data?.items ?? []}
              columns={columns}
              getRowKey={(item) => item.id}
              loading={funcionariosQuery.isLoading}
              error={funcionariosQuery.isError}
              emptyTitle="Nenhum funcionario encontrado"
              emptyDescription="Ajuste os filtros ou cadastre um novo funcionario para comecar."
              page={funcionariosQuery.data?.page ?? page}
              hasNext={funcionariosQuery.data?.has_next}
              onPageChange={setPage}
              onRetry={() => funcionariosQuery.refetch()}
            />
          </CardContent>
        </Card>
      </div>
    </PermissionGate>
  );
}
