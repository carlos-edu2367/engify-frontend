import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, BriefcaseBusiness, CalendarDays, Clock3, Shield, UserRound, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { rhService } from "@/services/rh.service";
import { getApiErrorMessage } from "@/lib/utils";
import { PermissionGate } from "../../shared/components/PermissionGate";
import { RhErrorState } from "../../shared/components/RhErrorState";
import { RhPageHeader } from "../../shared/components/RhPageHeader";
import { RhStatusBadge } from "../../shared/components/RhStatusBadge";
import { RhTableSkeleton } from "../../shared/components/RhTableSkeleton";
import { SensitiveValue } from "../../shared/components/SensitiveValue";
import { useRhPermission } from "../../shared/hooks/useRhPermission";
import { formatRhCurrency, formatRhDate, maskCpf, summarizeSchedule } from "../../shared/utils/formatters";
import { rhPaths } from "../../shared/utils/paths";
import { rhQueryKeys } from "../../shared/utils/queryKeys";
import { useFuncionarioDetail } from "../hooks/useFuncionarios";

export function FuncionarioDetailPage() {
  const { id } = useParams();
  const { can } = useRhPermission();
  const queryClient = useQueryClient();
  const funcionarioQuery = useFuncionarioDetail(id);
  const funcionario = funcionarioQuery.data;
  const [inactivateOpen, setInactivateOpen] = useState(false);
  const [salaryOpen, setSalaryOpen] = useState(false);
  const [salaryBase, setSalaryBase] = useState("");
  const [salaryReason, setSalaryReason] = useState("");

  const inactivateMutation = useMutation({
    mutationFn: () => rhService.update(id!, { is_active: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rhQueryKeys.funcionarios.all() });
      queryClient.invalidateQueries({ queryKey: rhQueryKeys.funcionarios.detail(id ?? null) });
      toast.success("Funcionario inativado.");
      setInactivateOpen(false);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const salaryMutation = useMutation({
    mutationFn: () =>
      rhService.update(id!, {
        salario_base: salaryBase,
        reason: salaryReason.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rhQueryKeys.funcionarios.all() });
      queryClient.invalidateQueries({ queryKey: rhQueryKeys.funcionarios.detail(id ?? null) });
      toast.success("Salario atualizado com motivo registrado.");
      setSalaryOpen(false);
      setSalaryReason("");
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const openSalaryDialog = () => {
    setSalaryBase(funcionario?.salario_base ?? "");
    setSalaryReason("");
    setSalaryOpen(true);
  };

  const confirmSalaryUpdate = () => {
    if (!salaryBase || !Number.isFinite(Number(salaryBase)) || Number(salaryBase) < 0) {
      toast.error("Informe um salario base valido.");
      return;
    }
    if (!salaryReason.trim()) {
      toast.error("Informe o motivo da alteracao salarial.");
      return;
    }
    salaryMutation.mutate();
  };

  return (
    <PermissionGate permission="rh.funcionarios.view" showDeniedState>
      <div className="flex flex-col gap-6">
        <RhPageHeader
          title={funcionario?.nome ?? "Funcionario"}
          description="Resumo inicial do cadastro. As abas operacionais completas serao expandidas nas proximas fases."
          actions={
            <Button variant="outline" asChild>
              <Link to={rhPaths.funcionarios}>Voltar</Link>
            </Button>
          }
        />

        {funcionarioQuery.isLoading ? <RhTableSkeleton rows={4} /> : null}
        {funcionarioQuery.isError ? <RhErrorState onRetry={() => funcionarioQuery.refetch()} /> : null}

        {funcionario ? (
          <>
            <div className="grid gap-4 lg:grid-cols-4">
              <Card className="lg:col-span-2">
                <CardContent className="flex flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Funcionario</p>
                      <p className="text-xl font-semibold">{funcionario.nome}</p>
                    </div>
                    <RhStatusBadge status={funcionario.is_active ? "ativo" : "inativo"} />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <SummaryItem label="Cargo" value={funcionario.cargo} />
                    <SummaryItem label="CPF" value={<SensitiveValue value={funcionario.cpf} masked={maskCpf(funcionario.cpf)} canReveal={can("rh.holerites.view_sensitive")} />} />
                    <SummaryItem label="Admissao" value={formatRhDate(funcionario.data_admissao)} />
                    <SummaryItem label="Usuario" value={funcionario.user_id ? "Vinculado" : "Sem vinculo"} />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Salario base</p>
                  <p className="mt-1 text-2xl font-semibold">
                    <SensitiveValue
                      value={funcionario.salario_base ? formatRhCurrency(funcionario.salario_base) : "Salario restrito"}
                      masked="R$ ******"
                      canReveal={can("rh.holerites.view_sensitive")}
                    />
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">Alteracoes salariais permanecem no fluxo legado ate a tela de edicao guiada.</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Jornada</p>
                  <p className="mt-1 text-2xl font-semibold">{summarizeSchedule(funcionario.horario_trabalho?.turnos)}</p>
                  <p className="mt-2 text-xs text-muted-foreground">Detalhe completo abaixo.</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="dados" className="flex flex-col gap-4">
              <TabsList className="flex w-full flex-wrap justify-start">
                <TabsTrigger value="dados">Dados</TabsTrigger>
                <TabsTrigger value="contrato">Contrato</TabsTrigger>
                <TabsTrigger value="jornada">Jornada</TabsTrigger>
                <TabsTrigger value="ponto">Ponto</TabsTrigger>
                <TabsTrigger value="ausencias">Ferias/Atestados</TabsTrigger>
                <TabsTrigger value="holerites">Holerites</TabsTrigger>
                <TabsTrigger value="auditoria">Auditoria</TabsTrigger>
              </TabsList>

              <TabsContent value="dados">
                <InfoCard icon={<UserRound className="size-5" />} title="Dados pessoais">
                  <SummaryGrid
                    items={[
                      ["Nome", funcionario.nome],
                      ["CPF", <SensitiveValue key="cpf" value={funcionario.cpf} masked={maskCpf(funcionario.cpf)} canReveal={can("rh.holerites.view_sensitive")} />],
                      ["Usuario vinculado", funcionario.user_id ?? "Sem vinculo"],
                    ]}
                  />
                </InfoCard>
              </TabsContent>
              <TabsContent value="contrato">
                <InfoCard icon={<BriefcaseBusiness className="size-5" />} title="Contrato">
                  <SummaryGrid
                    items={[
                      ["Cargo", funcionario.cargo],
                      ["Admissao", formatRhDate(funcionario.data_admissao)],
                      ["Status", funcionario.is_active ? "Ativo" : "Inativo"],
                    ]}
                  />
                </InfoCard>
              </TabsContent>
              <TabsContent value="jornada">
                <InfoCard icon={<Clock3 className="size-5" />} title="Jornada">
                  {funcionario.horario_trabalho?.turnos.length ? (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {funcionario.horario_trabalho.turnos.map((turno) => (
                        <div key={turno.dia_semana} className="rounded-md border p-3">
                          <p className="font-medium">Dia {turno.dia_semana + 1}</p>
                          <p className="text-sm text-muted-foreground">
                            {turno.hora_entrada.slice(0, 5)} as {turno.hora_saida.slice(0, 5)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhuma jornada cadastrada.</p>
                  )}
                </InfoCard>
              </TabsContent>
              <TabsContent value="ponto">
                <PlaceholderCard icon={<Clock3 className="size-5" />} title="Ponto" text="A experiencia detalhada de ponto fica para a Fase 4. Use a tela legada de RH enquanto a rota dedicada nao e migrada." />
              </TabsContent>
              <TabsContent value="ausencias">
                <PlaceholderCard icon={<CalendarDays className="size-5" />} title="Ferias e atestados" text="Fluxos operacionais serao migrados na Fase 4 sem remover a funcionalidade legada." />
              </TabsContent>
              <TabsContent value="holerites">
                <PlaceholderCard icon={<Wallet className="size-5" />} title="Holerites" text="A visualizacao avancada de holerites sera implementada na fase de folha." />
              </TabsContent>
              <TabsContent value="auditoria">
                <PlaceholderCard icon={<Shield className="size-5" />} title="Auditoria" text="A auditoria completa sera migrada em fase propria. O backend ja possui endpoint usado pela tela legada." />
              </TabsContent>
            </Tabs>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="size-5" />
                  Acoes criticas
                </CardTitle>
                <CardDescription>Acoes com impacto operacional exigem permissao e confirmacao.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {can("rh.funcionarios.update") && funcionario.is_active ? (
                  <Button variant="destructive" onClick={() => setInactivateOpen(true)}>
                    Inativar funcionario
                  </Button>
                ) : null}
                <Button variant="outline" disabled={!can("rh.funcionarios.update_salary")} onClick={openSalaryDialog}>
                  Editar salario guiado
                </Button>
                <p className="basis-full text-xs text-muted-foreground">
                  Alteracao salarial exige motivo administrativo e usa o endpoint atual de atualizacao do funcionario.
                </p>
              </CardContent>
            </Card>

            <ConfirmDialog
              open={inactivateOpen}
              onOpenChange={setInactivateOpen}
              title="Inativar funcionario"
              description="O funcionario deixa de aparecer como ativo nas operacoes de RH. Historicos permanecem preservados."
              confirmLabel="Inativar"
              variant="destructive"
              loading={inactivateMutation.isPending}
              onConfirm={() => inactivateMutation.mutate()}
            />

            <Dialog open={salaryOpen} onOpenChange={setSalaryOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Alterar salario base</DialogTitle>
                  <DialogDescription>
                    Revise o valor e informe o motivo. Esta acao pode impactar folhas em rascunho e historico operacional.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium">Novo salario base</span>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={salaryBase}
                      onChange={(event) => setSalaryBase(event.target.value)}
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium">Motivo</span>
                    <Textarea
                      value={salaryReason}
                      onChange={(event) => setSalaryReason(event.target.value)}
                      placeholder="Ex.: reajuste aprovado para a competencia atual"
                    />
                  </label>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSalaryOpen(false)} disabled={salaryMutation.isPending}>
                    Cancelar
                  </Button>
                  <Button onClick={confirmSalaryUpdate} disabled={salaryMutation.isPending}>
                    {salaryMutation.isPending ? "Salvando..." : "Salvar alteracao"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        ) : null}
      </div>
    </PermissionGate>
  );
}

function SummaryItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function InfoCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function PlaceholderCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <InfoCard icon={icon} title={title}>
      <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">{text}</div>
    </InfoCard>
  );
}

function SummaryGrid({ items }: { items: Array<[string, React.ReactNode]> }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map(([label, value]) => (
        <SummaryItem key={label} label={label} value={value} />
      ))}
    </div>
  );
}
