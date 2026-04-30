import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HelpCircle, Plus, Sparkles, Table2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { rhService } from "@/services/rh.service";
import type { RhTabelaProgressiva, RhTabelaProgressivaFormData } from "@/types/rh.types";
import { getApiErrorMessage } from "@/lib/utils";
import { PermissionGate } from "../../shared/components/PermissionGate";
import { RhDataTable, type RhColumn } from "../../shared/components/RhDataTable";
import { RhPageHeader } from "../../shared/components/RhPageHeader";
import { RhStatusBadge } from "../../shared/components/RhStatusBadge";
import { useDebouncedValue } from "../../shared/hooks/useDebouncedValue";
import { useRhPermission } from "../../shared/hooks/useRhPermission";
import { formatRhDate } from "../../shared/utils/formatters";
import { rhQueryKeys } from "../../shared/utils/queryKeys";
import { tabelaProgressivaPresets } from "../../encargos/utils/encargoPresets";
import { TabelaProgressivaDialog } from "../components/TabelaProgressivaDialog";
import { TabelaProgressivaTutorialDialog } from "../components/TabelaProgressivaTutorialDialog";

const columns: Array<RhColumn<RhTabelaProgressiva>> = [
  { key: "nome", header: "Tabela", render: (item) => <div><p className="font-medium">{item.nome}</p><p className="text-xs text-muted-foreground">{item.codigo}</p></div> },
  { key: "vigencia", header: "Vigencia", render: (item) => `${formatRhDate(item.vigencia_inicio)} ate ${formatRhDate(item.vigencia_fim)}` },
  { key: "faixas", header: "Faixas", render: (item) => String(item.faixas?.length ?? 0) },
  { key: "status", header: "Status", render: (item) => <RhStatusBadge status={item.status} /> },
];

export function TabelasProgressivasPage() {
  const { can } = useRhPermission();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [initialData, setInitialData] = useState<RhTabelaProgressivaFormData | null>(null);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search);
  const filters = { page, limit: 20, search: debouncedSearch || undefined };
  const query = useQuery({
    queryKey: rhQueryKeys.encargos.tabelas(filters),
    queryFn: () => rhService.listTabelasProgressivas(filters),
    retry: 1,
  });
  const createMutation = useMutation({
    mutationFn: async (data: RhTabelaProgressivaFormData) => {
      const { faixas, ...tabelaPayload } = data;
      const tabela = await rhService.createTabelaProgressiva(tabelaPayload);
      return rhService.updateTabelaProgressivaFaixas(tabela.id, faixas);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...rhQueryKeys.all, "encargos", "tabelas"] });
      toast.success("Tabela criada.");
      setDialogOpen(false);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
  const canCreate = can("rh.regras.create");

  return (
    <PermissionGate permission="rh.regras.view" showDeniedState>
      <div className="flex flex-col gap-6">
        <RhPageHeader
          title="Tabelas progressivas"
          description="Cadastre faixas de calculo usadas por regras progressivas."
          actions={(
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => setTutorialOpen(true)}>
                <HelpCircle className="size-4" />
                Como criar?
              </Button>
              {canCreate ? (
                <Button onClick={() => { setInitialData(null); setDialogOpen(true); }}>
                  <Plus className="size-4" />
                  Nova tabela
                </Button>
              ) : null}
            </div>
          )}
        />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Table2 className="size-5" /> Tabelas</CardTitle>
            <CardDescription>Consulte faixas, vigencias e status das tabelas usadas nos calculos.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {canCreate ? (
              <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 size-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Tabelas recomendadas</p>
                    <p className="text-xs text-muted-foreground">
                      Use modelos oficiais como ponto de partida e revise a competencia antes de salvar.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setInitialData(tabelaProgressivaPresets.inss2026);
                    setDialogOpen(true);
                  }}
                >
                  Cadastrar tabela INSS 2026
                </Button>
              </div>
            ) : null}
            <Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar tabela" />
            <RhDataTable
              items={query.data?.items ?? []}
              columns={columns}
              getRowKey={(item) => item.id}
              loading={query.isLoading}
              error={query.isError}
              emptyTitle="Nenhuma tabela encontrada"
              emptyDescription="Cadastre tabelas progressivas para manter as faixas de calculo organizadas."
              page={query.data?.page ?? page}
              hasNext={query.data?.has_next}
              onPageChange={setPage}
              onRetry={() => query.refetch()}
            />
          </CardContent>
        </Card>
        <TabelaProgressivaDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          loading={createMutation.isPending}
          initialData={initialData}
          onSubmit={(data) => createMutation.mutate(data)}
        />
        <TabelaProgressivaTutorialDialog open={tutorialOpen} onOpenChange={setTutorialOpen} />
      </div>
    </PermissionGate>
  );
}
