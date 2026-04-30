import { useState } from "react";
import { FileClock, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { RhTipoAtestado } from "@/types/rh.types";
import { RhDataTable, type RhColumn } from "../../shared/components/RhDataTable";
import { useAtestadoActions, useTiposAtestado } from "../../atestados/hooks/useAtestadosOperacionais";

const emptyForm = { nome: "", prazo_entrega_dias: "3", descricao: "", abona_falta: true };

export function TiposAtestadoSection() {
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RhTipoAtestado | null>(null);
  const [form, setForm] = useState(emptyForm);
  const tiposQuery = useTiposAtestado(page, 20);
  const actions = useAtestadoActions();

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const columns: Array<RhColumn<RhTipoAtestado>> = [
    { key: "nome", header: "Nome", render: (item) => item.nome },
    { key: "prazo", header: "Prazo", render: (item) => `${item.prazo_entrega_dias} dia(s)` },
    { key: "abona", header: "Abona falta", render: (item) => (item.abona_falta ? "Sim" : "Nao") },
    { key: "descricao", header: "Descricao", render: (item) => item.descricao ?? "-" },
    {
      key: "actions",
      header: "Acoes",
      render: (item) => (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditing(item);
              setForm({
                nome: item.nome,
                prazo_entrega_dias: String(item.prazo_entrega_dias),
                descricao: item.descricao ?? "",
                abona_falta: item.abona_falta,
              });
              setDialogOpen(true);
            }}
          >
            Editar
          </Button>
          <Button variant="destructive" size="sm" onClick={() => actions.deleteTipo.mutate(item.id)} disabled={actions.deleteTipo.isPending}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  const submit = () => {
    const payload = {
      nome: form.nome.trim(),
      prazo_entrega_dias: Number(form.prazo_entrega_dias),
      abona_falta: form.abona_falta,
      descricao: form.descricao.trim() || null,
    };
    if (editing) {
      actions.updateTipo.mutate({ id: editing.id, data: payload }, { onSuccess: () => setDialogOpen(false) });
      return;
    }
    actions.createTipo.mutate(payload, { onSuccess: () => setDialogOpen(false) });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileClock className="size-5" />
              Tipos de atestado
            </CardTitle>
            <CardDescription>Defina prazos, regras de abono e descricoes usadas nas solicitacoes de atestado.</CardDescription>
          </div>
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Novo tipo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <RhDataTable
          items={tiposQuery.data?.items ?? []}
          columns={columns}
          getRowKey={(item) => item.id}
          loading={tiposQuery.isLoading}
          error={tiposQuery.isError}
          emptyTitle="Nenhum tipo cadastrado"
          emptyDescription="Crie tipos para classificar atestados e prazos de entrega."
          page={tiposQuery.data?.page ?? page}
          hasNext={tiposQuery.data?.has_next}
          onPageChange={setPage}
          onRetry={() => tiposQuery.refetch()}
        />
      </CardContent>
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditing(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar tipo" : "Novo tipo"}</DialogTitle>
            <DialogDescription>Nome, prazo e regra de abono usados nas filas de atestados.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <Input value={form.nome} onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))} placeholder="Nome" />
            <Input value={form.prazo_entrega_dias} onChange={(event) => setForm((current) => ({ ...current, prazo_entrega_dias: event.target.value }))} placeholder="Prazo em dias" />
            <label className="flex items-center gap-2 rounded-md border p-3 text-sm md:col-span-2">
              <input type="checkbox" checked={form.abona_falta} onChange={(event) => setForm((current) => ({ ...current, abona_falta: event.target.checked }))} />
              Abona falta
            </label>
            <Textarea className="md:col-span-2" rows={3} value={form.descricao} onChange={(event) => setForm((current) => ({ ...current, descricao: event.target.value }))} placeholder="Descricao" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={submit} disabled={!form.nome.trim() || actions.createTipo.isPending || actions.updateTipo.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
