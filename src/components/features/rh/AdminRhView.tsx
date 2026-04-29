import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { funcionarioSchema, type FuncionarioFormValues } from "@/lib/schemas/rh.schemas";
import { formatCurrency, formatDate, getApiErrorMessage } from "@/lib/utils";
import { rhService } from "@/services/rh.service";
import type {
  RhAjustePonto,
  RhAtestado,
  RhFerias,
  RhFuncionarioListItem,
  RhHolerite,
  RhLocalPonto,
  RhRegistroPonto,
  RhStatusAjuste,
  RhStatusAtestado,
  RhStatusFerias,
  RhStatusHolerite,
  RhStatusPonto,
  RhTipoAtestado,
} from "@/types/rh.types";
import {
  BriefcaseBusiness,
  CalendarCheck,
  Clock3,
  FileClock,
  FileSearch,
  FileText,
  MapPin,
  Pencil,
  Plus,
  Search,
  Shield,
  Trash2,
  Wallet,
} from "lucide-react";
import {
  ActionRow,
  AdminDashboardSection,
  AuditSection,
  Field,
  FuncionarioFields,
  QueueEmpty,
  QueueHeader,
  ScheduleEditor,
  statusBadgeVariant,
  statusLabel,
} from "./rh-shared";
import { buildDateEnd, buildDateStart, buildDefaultSchedule, buildScheduleFromTurnos, extractTurnos, formatDateTime, type ScheduleRow } from "./rh-utils";
import { MapPicker } from "./MapPicker";

const employeeDialogContentClass = "max-h-[90dvh] w-[calc(100vw-2rem)] max-w-3xl overflow-y-auto p-4 sm:p-6";

type ReasonDialogState =
  | { kind: "ajuste"; item: RhAjustePonto }
  | { kind: "ferias-rejeitar"; item: RhFerias }
  | { kind: "ferias-cancelar"; item: RhFerias }
  | { kind: "atestado-rejeitar"; item: RhAtestado }
  | { kind: "atestado-entregar"; item: RhAtestado };

type LocalFormState = {
  id?: string;
  nome: string;
  latitude: string;
  longitude: string;
  raio_metros: string;
};

type TipoFormState = {
  id?: string;
  nome: string;
  prazo_entrega_dias: string;
  abona_falta: boolean;
  descricao: string;
};

const pontoStatusOptions: Array<{ value: RhStatusPonto | "all"; label: string }> = [
  { value: "all", label: "Todos os status" },
  { value: "validado", label: "Validado" },
  { value: "negado", label: "Negado" },
  { value: "inconsistente", label: "Inconsistente" },
  { value: "ajustado", label: "Ajustado" },
];

const ajusteStatusOptions: Array<{ value: RhStatusAjuste | "all"; label: string }> = [
  { value: "all", label: "Todos os status" },
  { value: "pendente", label: "Pendente" },
  { value: "aprovado", label: "Aprovado" },
  { value: "rejeitado", label: "Rejeitado" },
];

const feriasStatusOptions: Array<{ value: RhStatusFerias | "all"; label: string }> = [
  { value: "all", label: "Todos os status" },
  { value: "solicitado", label: "Solicitado" },
  { value: "aprovado", label: "Aprovado" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "concluido", label: "Concluido" },
  { value: "cancelado", label: "Cancelado" },
  { value: "rejeitado", label: "Rejeitado" },
];

const atestadoStatusOptions: Array<{ value: RhStatusAtestado | "all"; label: string }> = [
  { value: "all", label: "Todos os status" },
  { value: "aguardando_entrega", label: "Aguardando entrega" },
  { value: "entregue", label: "Entregue" },
  { value: "vencido", label: "Vencido" },
  { value: "rejeitado", label: "Rejeitado" },
];

const folhaStatusOptions: Array<{ value: RhStatusHolerite | "all"; label: string }> = [
  { value: "all", label: "Todos os status" },
  { value: "rascunho", label: "Rascunho" },
  { value: "fechado", label: "Fechado" },
  { value: "cancelado", label: "Cancelado" },
];

function buildLocalForm(local?: RhLocalPonto): LocalFormState {
  return {
    id: local?.id,
    nome: local?.nome ?? "",
    latitude: local ? String(local.latitude) : "",
    longitude: local ? String(local.longitude) : "",
    raio_metros: local ? String(local.raio_metros) : "100",
  };
}

function buildTipoForm(tipo?: RhTipoAtestado): TipoFormState {
  return {
    id: tipo?.id,
    nome: tipo?.nome ?? "",
    prazo_entrega_dias: tipo ? String(tipo.prazo_entrega_dias) : "3",
    abona_falta: tipo?.abona_falta ?? false,
    descricao: tipo?.descricao ?? "",
  };
}

function emptyEmployeeValues(): FuncionarioFormValues {
  return {
    nome: "",
    cpf: "",
    cargo: "",
    salario_base: "",
    data_admissao: "",
    user_id: "",
    reason: undefined,
    is_active: true,
  };
}

export function AdminRhView() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [competenciaMes, setCompetenciaMes] = useState(new Date().getMonth() + 1);
  const [competenciaAno, setCompetenciaAno] = useState(new Date().getFullYear());
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [holeriteSheetId, setHoleriteSheetId] = useState<string | null>(null);
  const [closeFolhaConfirmOpen, setCloseFolhaConfirmOpen] = useState(false);
  const [createSchedule, setCreateSchedule] = useState<ScheduleRow[]>(buildDefaultSchedule);
  const [editSchedule, setEditSchedule] = useState<ScheduleRow[]>(buildDefaultSchedule);
  const [reasonDialog, setReasonDialog] = useState<ReasonDialogState | null>(null);
  const [reasonText, setReasonText] = useState("");
  const [filePathText, setFilePathText] = useState("");
  const [localDialogOpen, setLocalDialogOpen] = useState(false);
  const [localForm, setLocalForm] = useState<LocalFormState>(buildLocalForm());
  const [localDeleteId, setLocalDeleteId] = useState<string | null>(null);
  const [tipoDialogOpen, setTipoDialogOpen] = useState(false);
  const [tipoForm, setTipoForm] = useState<TipoFormState>(buildTipoForm());
  const [tipoDeleteId, setTipoDeleteId] = useState<string | null>(null);
  const [ajusteStatus, setAjusteStatus] = useState<RhStatusAjuste | "all">("pendente");
  const [feriasStatus, setFeriasStatus] = useState<RhStatusFerias | "all">("solicitado");
  const [atestadoStatus, setAtestadoStatus] = useState<RhStatusAtestado | "all">("all");
  const [pontoStatus, setPontoStatus] = useState<RhStatusPonto | "all">("all");
  const [folhaStatus, setFolhaStatus] = useState<RhStatusHolerite | "all">("all");
  const [queueStart, setQueueStart] = useState("");
  const [queueEnd, setQueueEnd] = useState("");
  const [pontoStart, setPontoStart] = useState("");
  const [pontoEnd, setPontoEnd] = useState("");
  const [auditStart, setAuditStart] = useState("");
  const [auditEnd, setAuditEnd] = useState("");
  const [auditEntityType, setAuditEntityType] = useState("");
  const [auditAction, setAuditAction] = useState("");

  const createForm = useForm<FuncionarioFormValues>({
    resolver: zodResolver(funcionarioSchema),
    defaultValues: emptyEmployeeValues(),
  });

  const editForm = useForm<FuncionarioFormValues>({
    resolver: zodResolver(funcionarioSchema),
    defaultValues: emptyEmployeeValues(),
  });

  const funcionariosQuery = useQuery({
    queryKey: ["rh-funcionarios", deferredSearch],
    queryFn: () => rhService.list(1, 100, deferredSearch || undefined),
  });

  const dashboardQuery = useQuery({
    queryKey: ["rh-dashboard", competenciaMes, competenciaAno],
    queryFn: () => rhService.getDashboard(competenciaMes, competenciaAno),
  });

  const detailQuery = useQuery({
    queryKey: ["rh-funcionario", selectedId],
    queryFn: () => rhService.getById(selectedId!),
    enabled: !!selectedId && editOpen,
  });

  const locaisQuery = useQuery({
    queryKey: ["rh-locais-ponto", selectedId],
    queryFn: () => rhService.listLocaisPonto(selectedId!, 1, 100),
    enabled: !!selectedId && editOpen,
  });

  const pontosQuery = useQuery({
    queryKey: ["rh-pontos", selectedId, pontoStatus, pontoStart, pontoEnd],
    queryFn: () =>
      rhService.listPontos({
        page: 1,
        limit: 100,
        funcionario_id: selectedId ?? undefined,
        status: pontoStatus === "all" ? undefined : pontoStatus,
        start: pontoStart ? buildDateStart(pontoStart) : undefined,
        end: pontoEnd ? buildDateEnd(pontoEnd) : undefined,
      }),
  });

  const ajustesQuery = useQuery({
    queryKey: ["rh-ajustes", selectedId, ajusteStatus, queueStart, queueEnd],
    queryFn: () =>
      rhService.listAjustes({
        page: 1,
        limit: 100,
        funcionario_id: selectedId ?? undefined,
        status: ajusteStatus === "all" ? undefined : ajusteStatus,
        start: queueStart ? buildDateStart(queueStart) : undefined,
        end: queueEnd ? buildDateEnd(queueEnd) : undefined,
      }),
  });

  const feriasQuery = useQuery({
    queryKey: ["rh-ferias", selectedId, feriasStatus, queueStart, queueEnd],
    queryFn: () =>
      rhService.listFerias({
        page: 1,
        limit: 100,
        funcionario_id: selectedId ?? undefined,
        status: feriasStatus === "all" ? undefined : feriasStatus,
        start: queueStart ? buildDateStart(queueStart) : undefined,
        end: queueEnd ? buildDateEnd(queueEnd) : undefined,
      }),
  });

  const atestadosQuery = useQuery({
    queryKey: ["rh-atestados", selectedId, atestadoStatus, queueStart, queueEnd],
    queryFn: () =>
      rhService.listAtestados({
        page: 1,
        limit: 100,
        funcionario_id: selectedId ?? undefined,
        status: atestadoStatus === "all" ? undefined : atestadoStatus,
        start: queueStart ? buildDateStart(queueStart) : undefined,
        end: queueEnd ? buildDateEnd(queueEnd) : undefined,
      }),
  });

  const tiposAtestadoQuery = useQuery({
    queryKey: ["rh-tipos-atestado"],
    queryFn: () => rhService.listTiposAtestado(1, 100),
  });

  const folhaQuery = useQuery({
    queryKey: ["rh-folha", competenciaMes, competenciaAno, selectedId, folhaStatus],
    queryFn: () =>
      rhService.listFolha({
        page: 1,
        limit: 100,
        mes: competenciaMes,
        ano: competenciaAno,
        funcionario_id: selectedId ?? undefined,
        status: folhaStatus === "all" ? undefined : folhaStatus,
      }),
  });

  const auditQuery = useQuery({
    queryKey: ["rh-audit-logs", auditEntityType, auditAction, auditStart, auditEnd],
    queryFn: () =>
      rhService.listAuditLogs({
        page: 1,
        limit: 50,
        entity_type: auditEntityType || undefined,
        action: auditAction || undefined,
        start: auditStart ? buildDateStart(auditStart) : undefined,
        end: auditEnd ? buildDateEnd(auditEnd) : undefined,
      }),
  });

  const holeriteDetailQuery = useQuery({
    queryKey: ["rh-holerite", holeriteSheetId],
    queryFn: () => rhService.getHolerite(holeriteSheetId!),
    enabled: !!holeriteSheetId,
  });

  useEffect(() => {
    if (!detailQuery.data) {
      return;
    }
    editForm.reset({
      nome: detailQuery.data.nome,
      cpf: detailQuery.data.cpf,
      cargo: detailQuery.data.cargo,
      salario_base: String(detailQuery.data.salario_base),
      data_admissao: detailQuery.data.data_admissao,
      user_id: detailQuery.data.user_id ?? "",
      reason: undefined,
      is_active: detailQuery.data.is_active,
    });
    setEditSchedule(buildScheduleFromTurnos(detailQuery.data.horario_trabalho?.turnos));
  }, [detailQuery.data, editForm]);

  const funcionarioById = useMemo(() => {
    const map = new Map<string, RhFuncionarioListItem>();
    for (const funcionario of funcionariosQuery.data?.items ?? []) {
      map.set(funcionario.id, funcionario);
    }
    return map;
  }, [funcionariosQuery.data?.items]);

  const invalidateRh = () => {
    queryClient.invalidateQueries({ queryKey: ["rh-funcionarios"] });
    queryClient.invalidateQueries({ queryKey: ["rh-funcionario"] });
    queryClient.invalidateQueries({ queryKey: ["rh-locais-ponto"] });
    queryClient.invalidateQueries({ queryKey: ["rh-dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["rh-pontos"] });
    queryClient.invalidateQueries({ queryKey: ["rh-ajustes"] });
    queryClient.invalidateQueries({ queryKey: ["rh-ferias"] });
    queryClient.invalidateQueries({ queryKey: ["rh-atestados"] });
    queryClient.invalidateQueries({ queryKey: ["rh-tipos-atestado"] });
    queryClient.invalidateQueries({ queryKey: ["rh-folha"] });
    queryClient.invalidateQueries({ queryKey: ["rh-holerite"] });
    queryClient.invalidateQueries({ queryKey: ["rh-audit-logs"] });
  };

  const createMutation = useMutation({
    mutationFn: async (values: FuncionarioFormValues) => {
      const turnos = extractTurnos(createSchedule);
      if (!turnos.length) {
        throw new Error("Selecione pelo menos um dia no horario de trabalho.");
      }
      return rhService.create({
        nome: values.nome,
        cpf: values.cpf,
        cargo: values.cargo,
        salario_base: values.salario_base,
        data_admissao: values.data_admissao,
        user_id: values.user_id?.trim() || null,
        horario_trabalho: { turnos },
      });
    },
    onSuccess: () => {
      invalidateRh();
      toast.success("Funcionario criado com sucesso.");
      setCreateOpen(false);
      createForm.reset(emptyEmployeeValues());
      setCreateSchedule(buildDefaultSchedule());
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const updateMutation = useMutation({
    mutationFn: async (values: FuncionarioFormValues) => {
      if (!selectedId) {
        throw new Error("Funcionario nao selecionado.");
      }
      const turnos = extractTurnos(editSchedule);
      if (!turnos.length) {
        throw new Error("Selecione pelo menos um dia no horario de trabalho.");
      }
      const currentSalary = detailQuery.data?.salario_base ? String(detailQuery.data.salario_base) : "";
      const nextSalary = values.salario_base;
      const reason =
        currentSalary && currentSalary !== nextSalary ? values.reason?.trim() || undefined : undefined;
      await rhService.update(selectedId, {
        nome: values.nome,
        cpf: values.cpf,
        cargo: values.cargo,
        salario_base: values.salario_base,
        data_admissao: values.data_admissao,
        user_id: values.user_id?.trim() || null,
        is_active: values.is_active ?? true,
        reason,
      });
      return rhService.updateHorario(selectedId, { turnos });
    },
    onSuccess: () => {
      invalidateRh();
      toast.success("Funcionario atualizado com sucesso.");
      setEditOpen(false);
      setSelectedId(null);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => rhService.delete(id),
    onSuccess: () => {
      invalidateRh();
      toast.success("Funcionario removido.");
      setDeleteId(null);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const createOrUpdateLocalMutation = useMutation({
    mutationFn: async () => {
      if (!selectedId) {
        throw new Error("Selecione um funcionario.");
      }
      const payload = {
        nome: localForm.nome.trim(),
        latitude: Number(localForm.latitude),
        longitude: Number(localForm.longitude),
        raio_metros: Number(localForm.raio_metros),
      };
      if (!payload.nome || Number.isNaN(payload.latitude) || Number.isNaN(payload.longitude) || Number.isNaN(payload.raio_metros)) {
        throw new Error("Preencha nome, coordenadas e raio corretamente.");
      }
      if (localForm.id) {
        return rhService.updateLocalPonto(localForm.id, payload);
      }
      return rhService.createLocalPonto(selectedId, payload);
    },
    onSuccess: () => {
      invalidateRh();
      toast.success(localForm.id ? "Local de ponto atualizado." : "Local de ponto criado.");
      setLocalDialogOpen(false);
      setLocalForm(buildLocalForm());
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const deleteLocalMutation = useMutation({
    mutationFn: (id: string) => rhService.deleteLocalPonto(id),
    onSuccess: () => {
      invalidateRh();
      toast.success("Local de ponto removido.");
      setLocalDeleteId(null);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const createOrUpdateTipoMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        nome: tipoForm.nome.trim(),
        prazo_entrega_dias: Number(tipoForm.prazo_entrega_dias),
        abona_falta: tipoForm.abona_falta,
        descricao: tipoForm.descricao.trim() || null,
      };
      if (!payload.nome || Number.isNaN(payload.prazo_entrega_dias)) {
        throw new Error("Informe nome e prazo do tipo de atestado.");
      }
      if (tipoForm.id) {
        return rhService.updateTipoAtestado(tipoForm.id, payload);
      }
      return rhService.createTipoAtestado(payload);
    },
    onSuccess: () => {
      invalidateRh();
      toast.success(tipoForm.id ? "Tipo de atestado atualizado." : "Tipo de atestado criado.");
      setTipoDialogOpen(false);
      setTipoForm(buildTipoForm());
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const deleteTipoMutation = useMutation({
    mutationFn: (id: string) => rhService.deleteTipoAtestado(id),
    onSuccess: () => {
      invalidateRh();
      toast.success("Tipo de atestado removido.");
      setTipoDeleteId(null);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const approveAjusteMutation = useMutation({
    mutationFn: (id: string) => rhService.approveAjuste(id),
    onSuccess: () => {
      invalidateRh();
      toast.success("Ajuste aprovado.");
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const approveFeriasMutation = useMutation({
    mutationFn: (id: string) => rhService.approveFerias(id),
    onSuccess: () => {
      invalidateRh();
      toast.success("Ferias aprovadas.");
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const closeReasonDialog = () => {
    setReasonDialog(null);
    setReasonText("");
    setFilePathText("");
  };

  const reasonActionMutation = useMutation({
    mutationFn: async () => {
      if (!reasonDialog) {
        throw new Error("Acao nao selecionada.");
      }
      const reason = reasonText.trim();
      if (reasonDialog.kind !== "atestado-entregar" && !reason) {
        throw new Error("Informe o motivo da acao.");
      }
      if (reasonDialog.kind === "ajuste") {
        return rhService.rejectAjuste(reasonDialog.item.id, reason);
      }
      if (reasonDialog.kind === "ferias-rejeitar") {
        return rhService.rejectFerias(reasonDialog.item.id, reason);
      }
      if (reasonDialog.kind === "ferias-cancelar") {
        return rhService.cancelFerias(reasonDialog.item.id, reason);
      }
      if (reasonDialog.kind === "atestado-rejeitar") {
        return rhService.rejectAtestado(reasonDialog.item.id, reason);
      }
      if (!filePathText.trim()) {
        throw new Error("Informe o file_path do documento entregue.");
      }
      return rhService.deliverAtestado(reasonDialog.item.id, { file_path: filePathText.trim() });
    },
    onSuccess: () => {
      invalidateRh();
      toast.success("Acao concluida.");
      closeReasonDialog();
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const generateFolhaMutation = useMutation({
    mutationFn: () =>
      rhService.generateFolha({
        mes: competenciaMes,
        ano: competenciaAno,
        funcionario_id: selectedId ?? undefined,
      }),
    onSuccess: (items) => {
      invalidateRh();
      toast.success(`${items.length} holerite(s) em rascunho gerados.`);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const closeFolhaMutation = useMutation({
    mutationFn: () =>
      rhService.closeFolha({
        mes: competenciaMes,
        ano: competenciaAno,
        funcionario_ids: selectedId ? [selectedId] : undefined,
      }),
    onSuccess: (items) => {
      invalidateRh();
      toast.success(`${items.length} holerite(s) fechados com sucesso.`);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const saveHoleriteMutation = useMutation({
    mutationFn: async (payload: { id: string; acrescimos_manuais: string; descontos_manuais: string; motivo: string }) =>
      rhService.updateHoleriteAjustes(payload.id, {
        acrescimos_manuais: payload.acrescimos_manuais,
        descontos_manuais: payload.descontos_manuais,
        motivo: payload.motivo,
      }),
    onSuccess: () => {
      invalidateRh();
      toast.success("Ajustes manuais salvos.");
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const funcionarios = funcionariosQuery.data?.items ?? [];
  const selectedEmployeeName = selectedId ? funcionarioById.get(selectedId)?.nome ?? "Funcionario selecionado" : "Toda a equipe";
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Operacao RH</h1>
        <p className="text-sm text-muted-foreground">
          Funcionarios, jornada, solicitacoes, folha e auditoria em uma unica area operacional.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex w-full flex-wrap justify-start">
          <TabsTrigger value="overview">Dashboard</TabsTrigger>
          <TabsTrigger value="employees">Funcionarios</TabsTrigger>
          <TabsTrigger value="timekeeping">Ponto</TabsTrigger>
          <TabsTrigger value="requests">Solicitacoes</TabsTrigger>
          <TabsTrigger value="payroll">Folha</TabsTrigger>
          <TabsTrigger value="audit">Auditoria</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <AdminDashboardSection
            summary={dashboardQuery.data}
            loading={dashboardQuery.isLoading}
            competenciaMes={competenciaMes}
            competenciaAno={competenciaAno}
            onCompetenciaMesChange={setCompetenciaMes}
            onCompetenciaAnoChange={setCompetenciaAno}
          />
        </TabsContent>

        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <BriefcaseBusiness className="h-5 w-5" />
                    Funcionarios
                  </CardTitle>
                  <CardDescription>
                    Cadastro, horario, status, vinculo com usuario e geofence por funcionario.
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    createForm.reset(emptyEmployeeValues());
                    setCreateSchedule(buildDefaultSchedule());
                    setCreateOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Novo funcionario
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_240px]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Buscar por nome ou cargo"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
                <Select value={selectedId ?? "all"} onValueChange={(value) => setSelectedId(value === "all" ? null : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar funcionario" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toda a equipe</SelectItem>
                    {funcionarios.map((funcionario) => (
                      <SelectItem key={funcionario.id} value={funcionario.id}>
                        {funcionario.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {funcionariosQuery.isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-20" />
                  ))}
                </div>
              ) : funcionarios.length === 0 ? (
                <EmptyState
                  title="Nenhum funcionario cadastrado"
                  description="Crie o primeiro funcionario para habilitar horarios, ponto e folha."
                  icon={<BriefcaseBusiness className="h-10 w-10" />}
                />
              ) : (
                <div className="space-y-3">
                  {funcionarios.map((funcionario) => (
                    <div key={funcionario.id} className="rounded-lg border p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">{funcionario.nome}</p>
                            <Badge variant={funcionario.is_active ? "success" : "secondary"}>
                              {funcionario.is_active ? "Ativo" : "Inativo"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {funcionario.cargo} - {funcionario.cpf_mascarado}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Admissao em {formatDate(funcionario.data_admissao)} - {formatCurrency(funcionario.salario_base)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedId(funcionario.id);
                              setEditOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedId(funcionario.id);
                              setActiveTab("timekeeping");
                            }}
                          >
                            <Clock3 className="h-4 w-4" />
                            Ver ponto
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => setDeleteId(funcionario.id)}>
                            <Trash2 className="h-4 w-4" />
                            Remover
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timekeeping" className="space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Clock3 className="h-5 w-5" />
                Registros de ponto
              </CardTitle>
              <CardDescription>
                Consulte batidas por funcionario, status e periodo para investigar jornada e excecoes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-4">
                <Field label="Funcionario">
                  <Select value={selectedId ?? "all"} onValueChange={(value) => setSelectedId(value === "all" ? null : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toda a equipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toda a equipe</SelectItem>
                      {funcionarios.map((funcionario) => (
                        <SelectItem key={funcionario.id} value={funcionario.id}>
                          {funcionario.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Status">
                  <Select value={pontoStatus} onValueChange={(value) => setPontoStatus(value as RhStatusPonto | "all")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {pontoStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Inicio">
                  <Input type="date" value={pontoStart} onChange={(event) => setPontoStart(event.target.value)} />
                </Field>
                <Field label="Fim">
                  <Input type="date" value={pontoEnd} onChange={(event) => setPontoEnd(event.target.value)} />
                </Field>
              </div>

              {pontosQuery.isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-16" />
                  ))}
                </div>
              ) : pontosQuery.data?.items.length ? (
                <div className="space-y-3">
                  {pontosQuery.data.items.map((item) => (
                    <PontoRow key={item.id} item={item} employeeName={funcionarioById.get(item.funcionario_id)?.nome} />
                  ))}
                </div>
              ) : (
                <QueueEmpty text="Nenhum registro de ponto encontrado para os filtros atuais." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Filtros operacionais</CardTitle>
              <CardDescription>
                Use os mesmos filtros para ajustes, ferias e atestados durante a triagem do RH.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              <Field label="Funcionario">
                <Select value={selectedId ?? "all"} onValueChange={(value) => setSelectedId(value === "all" ? null : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toda a equipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toda a equipe</SelectItem>
                    {funcionarios.map((funcionario) => (
                      <SelectItem key={funcionario.id} value={funcionario.id}>
                        {funcionario.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Inicio">
                <Input type="date" value={queueStart} onChange={(event) => setQueueStart(event.target.value)} />
              </Field>
              <Field label="Fim">
                <Input type="date" value={queueEnd} onChange={(event) => setQueueEnd(event.target.value)} />
              </Field>
            </CardContent>
          </Card>

          <Tabs defaultValue="ajustes" className="space-y-4">
            <TabsList className="flex w-full flex-wrap justify-start">
              <TabsTrigger value="ajustes">Ajustes</TabsTrigger>
              <TabsTrigger value="ferias">Ferias</TabsTrigger>
              <TabsTrigger value="atestados">Atestados</TabsTrigger>
              <TabsTrigger value="tipos">Tipos de atestado</TabsTrigger>
            </TabsList>

            <TabsContent value="ajustes" className="space-y-4">
              <Card>
                <CardHeader className="pb-4">
                  <QueueHeader icon={<FileClock className="h-5 w-5" />} title="Ajustes de ponto" count={ajustesQuery.data?.items.length ?? 0} />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Field label="Status">
                    <Select value={ajusteStatus} onValueChange={(value) => setAjusteStatus(value as RhStatusAjuste | "all")}>
                      <SelectTrigger className="w-full md:w-64">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ajusteStatusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  {ajustesQuery.isLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton key={index} className="h-20" />
                      ))}
                    </div>
                  ) : ajustesQuery.data?.items.length ? (
                    <div className="space-y-3">
                      {ajustesQuery.data.items.map((item) => (
                        <ActionRow
                          key={item.id}
                          title={funcionarioById.get(item.funcionario_id)?.nome ?? item.justificativa}
                          subtitle={`${formatDate(item.data_referencia)} - ${item.justificativa}`}
                          status={item.status}
                          onApprove={item.status === "pendente" ? () => approveAjusteMutation.mutate(item.id) : undefined}
                          onReject={
                            item.status === "pendente"
                              ? () => {
                                  setReasonDialog({ kind: "ajuste", item });
                                }
                              : undefined
                          }
                        />
                      ))}
                    </div>
                  ) : (
                    <QueueEmpty text="Nenhum ajuste encontrado para os filtros selecionados." />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ferias" className="space-y-4">
              <Card>
                <CardHeader className="pb-4">
                  <QueueHeader icon={<CalendarCheck className="h-5 w-5" />} title="Ferias" count={feriasQuery.data?.items.length ?? 0} />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Field label="Status">
                    <Select value={feriasStatus} onValueChange={(value) => setFeriasStatus(value as RhStatusFerias | "all")}>
                      <SelectTrigger className="w-full md:w-64">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {feriasStatusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  {feriasQuery.isLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton key={index} className="h-20" />
                      ))}
                    </div>
                  ) : feriasQuery.data?.items.length ? (
                    <div className="space-y-3">
                      {feriasQuery.data.items.map((item) => {
                        const actions =
                          item.status === "solicitado"
                            ? {
                                onApprove: () => approveFeriasMutation.mutate(item.id),
                                onReject: () => setReasonDialog({ kind: "ferias-rejeitar", item }),
                              }
                            : item.status === "aprovado" || item.status === "em_andamento"
                              ? {
                                  onApprove: undefined,
                                  onReject: () => setReasonDialog({ kind: "ferias-cancelar", item }),
                                }
                              : {};
                        return (
                          <ActionRow
                            key={item.id}
                            title={funcionarioById.get(item.funcionario_id)?.nome ?? "Funcionario"}
                            subtitle={`${formatDate(item.data_inicio)} ate ${formatDate(item.data_fim)}`}
                            status={item.status}
                            onApprove={actions.onApprove}
                            onReject={actions.onReject}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <QueueEmpty text="Nenhuma solicitacao de ferias encontrada." />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="atestados" className="space-y-4">
              <Card>
                <CardHeader className="pb-4">
                  <QueueHeader icon={<FileText className="h-5 w-5" />} title="Atestados" count={atestadosQuery.data?.items.length ?? 0} />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Field label="Status">
                    <Select value={atestadoStatus} onValueChange={(value) => setAtestadoStatus(value as RhStatusAtestado | "all")}>
                      <SelectTrigger className="w-full md:w-64">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {atestadoStatusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  {atestadosQuery.isLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton key={index} className="h-20" />
                      ))}
                    </div>
                  ) : atestadosQuery.data?.items.length ? (
                    <div className="space-y-3">
                      {atestadosQuery.data.items.map((item) => (
                        <Card key={item.id}>
                          <CardContent className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant={statusBadgeVariant(item.status)}>{statusLabel(item.status)}</Badge>
                                {item.has_file ? <Badge variant="info">Com arquivo</Badge> : <Badge variant="secondary">Sem arquivo</Badge>}
                              </div>
                              <p className="text-sm font-medium">
                                {funcionarioById.get(item.funcionario_id)?.nome ?? "Funcionario"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(item.data_inicio)} ate {formatDate(item.data_fim)}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {item.has_file ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      const response = await rhService.getAtestadoDownloadUrl(item.id);
                                      window.open(response.download_url, "_blank", "noopener,noreferrer");
                                    } catch (error) {
                                      toast.error(getApiErrorMessage(error));
                                    }
                                  }}
                                >
                                  <FileSearch className="h-4 w-4" />
                                  Abrir documento
                                </Button>
                              ) : null}
                              {item.status === "aguardando_entrega" ? (
                                <>
                                  <Button variant="outline" size="sm" onClick={() => setReasonDialog({ kind: "atestado-entregar", item })}>
                                    <FileText className="h-4 w-4" />
                                    Marcar entregue
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => setReasonDialog({ kind: "atestado-rejeitar", item })}>
                                    Rejeitar
                                  </Button>
                                </>
                              ) : null}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <QueueEmpty text="Nenhum atestado encontrado para os filtros atuais." />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tipos" className="space-y-4">
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle className="text-xl">Tipos de atestado</CardTitle>
                      <CardDescription>Cadastre e mantenha as regras usadas no autoatendimento.</CardDescription>
                    </div>
                    <Button
                      onClick={() => {
                        setTipoForm(buildTipoForm());
                        setTipoDialogOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      Novo tipo
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {tiposAtestadoQuery.isLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton key={index} className="h-16" />
                      ))}
                    </div>
                  ) : tiposAtestadoQuery.data?.items.length ? (
                    <div className="space-y-3">
                      {tiposAtestadoQuery.data.items.map((tipo) => (
                        <div key={tipo.id} className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium">{tipo.nome}</p>
                              <Badge variant={tipo.abona_falta ? "success" : "secondary"}>
                                {tipo.abona_falta ? "Abona falta" : "Sem abono"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Prazo de entrega: {tipo.prazo_entrega_dias} dia(s)
                            </p>
                            {tipo.descricao ? <p className="text-xs text-muted-foreground">{tipo.descricao}</p> : null}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setTipoForm(buildTipoForm(tipo));
                                setTipoDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                              Editar
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => setTipoDeleteId(tipo.id)}>
                              <Trash2 className="h-4 w-4" />
                              Remover
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <QueueEmpty text="Nenhum tipo de atestado cadastrado ainda." />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="payroll" className="space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Wallet className="h-5 w-5" />
                    Folha
                  </CardTitle>
                  <CardDescription>
                    Gere rascunhos, confira ajustes manuais e feche a competencia com idempotencia.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => generateFolhaMutation.mutate()} disabled={generateFolhaMutation.isPending}>
                    {generateFolhaMutation.isPending ? "Gerando..." : "Gerar rascunho"}
                  </Button>
                  <Button onClick={() => setCloseFolhaConfirmOpen(true)} disabled={closeFolhaMutation.isPending}>
                    {closeFolhaMutation.isPending ? "Fechando..." : "Fechar folha"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-4">
                <Field label="Mes">
                  <Input type="number" min={1} max={12} value={competenciaMes} onChange={(event) => setCompetenciaMes(Number(event.target.value) || 1)} />
                </Field>
                <Field label="Ano">
                  <Input type="number" min={2020} max={2100} value={competenciaAno} onChange={(event) => setCompetenciaAno(Number(event.target.value) || new Date().getFullYear())} />
                </Field>
                <Field label="Funcionario">
                  <Select value={selectedId ?? "all"} onValueChange={(value) => setSelectedId(value === "all" ? null : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toda a equipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toda a equipe</SelectItem>
                      {funcionarios.map((funcionario) => (
                        <SelectItem key={funcionario.id} value={funcionario.id}>
                          {funcionario.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Status">
                  <Select value={folhaStatus} onValueChange={(value) => setFolhaStatus(value as RhStatusHolerite | "all")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {folhaStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              {folhaQuery.isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-16" />
                  ))}
                </div>
              ) : folhaQuery.data?.items.length ? (
                <div className="space-y-3">
                  {folhaQuery.data.items.map((item) => (
                    <HoleriteRow
                      key={item.id}
                      item={item}
                      employeeName={funcionarioById.get(item.funcionario_id)?.nome}
                      onOpen={() => setHoleriteSheetId(item.id)}
                    />
                  ))}
                </div>
              ) : (
                <QueueEmpty text="Nenhum holerite encontrado para a competencia selecionada." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Shield className="h-5 w-5" />
                Filtros de auditoria
              </CardTitle>
              <CardDescription>
                Investigue eventos por tipo de entidade, acao e janela temporal.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-4">
              <Field label="Entidade">
                <Input value={auditEntityType} onChange={(event) => setAuditEntityType(event.target.value)} placeholder="ex.: atestado" />
              </Field>
              <Field label="Acao">
                <Input value={auditAction} onChange={(event) => setAuditAction(event.target.value)} placeholder="ex.: rh.ponto.created" />
              </Field>
              <Field label="Inicio">
                <Input type="date" value={auditStart} onChange={(event) => setAuditStart(event.target.value)} />
              </Field>
              <Field label="Fim">
                <Input type="date" value={auditEnd} onChange={(event) => setAuditEnd(event.target.value)} />
              </Field>
            </CardContent>
          </Card>
          <AuditSection items={auditQuery.data?.items ?? []} loading={auditQuery.isLoading} />
        </TabsContent>
      </Tabs>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className={employeeDialogContentClass}>
          <DialogHeader>
            <DialogTitle>Novo funcionario</DialogTitle>
            <DialogDescription>Cadastre os dados basicos e o horario inicial de trabalho.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <FuncionarioFields form={createForm} />
            <ScheduleEditor schedule={createSchedule} onChange={setCreateSchedule} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={createMutation.isPending}>
              Cancelar
            </Button>
            <Button onClick={createForm.handleSubmit((values) => createMutation.mutate(values))} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Salvando..." : "Criar funcionario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) {
            setSelectedId(null);
            setLocalDialogOpen(false);
          }
        }}
      >
        <DialogContent className={employeeDialogContentClass}>
          <DialogHeader>
            <DialogTitle>Funcionario</DialogTitle>
            <DialogDescription>
              Ajuste cadastro, horario e locais autorizados de ponto para {selectedEmployeeName}.
            </DialogDescription>
          </DialogHeader>
          {detailQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24" />
              <Skeleton className="h-72" />
              <Skeleton className="h-44" />
            </div>
          ) : detailQuery.data ? (
            <div className="space-y-4">
              <FuncionarioFields form={editForm} includeStatus includeReason />
              <ScheduleEditor schedule={editSchedule} onChange={setEditSchedule} />

              <Card>
                <CardHeader className="pb-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <MapPin className="h-5 w-5" />
                        Locais de ponto
                      </CardTitle>
                      <CardDescription>
                        Configure nome, coordenadas e raio aceito para o registro presencial.
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setLocalForm(buildLocalForm());
                        setLocalDialogOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      Novo local
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {locaisQuery.isLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton key={index} className="h-16" />
                      ))}
                    </div>
                  ) : locaisQuery.data?.items.length ? (
                    <div className="space-y-3">
                      {locaisQuery.data.items.map((local) => (
                        <div key={local.id} className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="font-medium">{local.nome}</p>
                            <p className="text-sm text-muted-foreground">
                              {local.latitude}, {local.longitude}
                            </p>
                            <p className="text-xs text-muted-foreground">Raio: {local.raio_metros} metros</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setLocalForm(buildLocalForm(local));
                                setLocalDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                              Editar
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => setLocalDeleteId(local.id)}>
                              <Trash2 className="h-4 w-4" />
                              Remover
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <QueueEmpty text="Nenhum local de ponto cadastrado para este funcionario." />
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <QueueEmpty text="Nao foi possivel carregar os dados do funcionario." />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={updateMutation.isPending}>
              Fechar
            </Button>
            <Button onClick={editForm.handleSubmit((values) => updateMutation.mutate(values))} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Salvando..." : "Salvar alteracoes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={localDialogOpen} onOpenChange={setLocalDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{localForm.id ? "Editar local de ponto" : "Novo local de ponto"}</DialogTitle>
            <DialogDescription>Informe um nome legivel e as coordenadas do local autorizado.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <Field label="Nome">
                <Input value={localForm.nome} onChange={(event) => setLocalForm((current) => ({ ...current, nome: event.target.value }))} />
              </Field>
              <Field label="Raio em metros">
                <Input
                  type="number"
                  value={localForm.raio_metros}
                  onChange={(event) => setLocalForm((current) => ({ ...current, raio_metros: event.target.value }))}
                />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Latitude">
                  <Input value={localForm.latitude} onChange={(event) => setLocalForm((current) => ({ ...current, latitude: event.target.value }))} />
                </Field>
                <Field label="Longitude">
                  <Input value={localForm.longitude} onChange={(event) => setLocalForm((current) => ({ ...current, longitude: event.target.value }))} />
                </Field>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Selecione no mapa</Label>
              <MapPicker
                lat={Number(localForm.latitude)}
                lng={Number(localForm.longitude)}
                radius={Number(localForm.raio_metros)}
                onChange={(lat, lng) =>
                  setLocalForm((current) => ({
                    ...current,
                    latitude: String(lat),
                    longitude: String(lng),
                  }))
                }
              />
              <p className="text-[10px] text-muted-foreground">
                Clique no mapa para definir a localização exata do ponto.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLocalDialogOpen(false)} disabled={createOrUpdateLocalMutation.isPending}>
              Cancelar
            </Button>
            <Button onClick={() => createOrUpdateLocalMutation.mutate()} disabled={createOrUpdateLocalMutation.isPending}>
              {createOrUpdateLocalMutation.isPending ? "Salvando..." : "Salvar local"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={tipoDialogOpen} onOpenChange={setTipoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tipoForm.id ? "Editar tipo de atestado" : "Novo tipo de atestado"}</DialogTitle>
            <DialogDescription>Esses dados aparecem na abertura de solicitacao pelo funcionario.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nome">
              <Input value={tipoForm.nome} onChange={(event) => setTipoForm((current) => ({ ...current, nome: event.target.value }))} />
            </Field>
            <Field label="Prazo de entrega em dias">
              <Input value={tipoForm.prazo_entrega_dias} onChange={(event) => setTipoForm((current) => ({ ...current, prazo_entrega_dias: event.target.value }))} />
            </Field>
            <div className="space-y-2 rounded-md border p-3 md:col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={tipoForm.abona_falta}
                  onChange={(event) => setTipoForm((current) => ({ ...current, abona_falta: event.target.checked }))}
                />
                Abona falta
              </label>
            </div>
            <div className="md:col-span-2">
              <Field label="Descricao">
                <Textarea rows={3} value={tipoForm.descricao} onChange={(event) => setTipoForm((current) => ({ ...current, descricao: event.target.value }))} />
              </Field>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTipoDialogOpen(false)} disabled={createOrUpdateTipoMutation.isPending}>
              Cancelar
            </Button>
            <Button onClick={() => createOrUpdateTipoMutation.mutate()} disabled={createOrUpdateTipoMutation.isPending}>
              {createOrUpdateTipoMutation.isPending ? "Salvando..." : "Salvar tipo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!reasonDialog} onOpenChange={(open) => (!open ? closeReasonDialog() : undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reasonDialog?.kind === "atestado-entregar" ? "Marcar atestado como entregue" : "Informe o motivo"}
            </DialogTitle>
            <DialogDescription>
              {reasonDialog?.kind === "ferias-cancelar"
                ? "Explique o cancelamento para manter o historico claro no RH."
                : reasonDialog?.kind === "atestado-entregar"
                  ? "O backend ainda opera com file_path. Informe o caminho armazenado do documento."
                  : "Essa justificativa vai para o historico da solicitacao."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {reasonDialog?.kind === "atestado-entregar" ? (
              <Field label="file_path do documento">
                <Input value={filePathText} onChange={(event) => setFilePathText(event.target.value)} placeholder="financeiro/<uuid>/arquivo.pdf" />
              </Field>
            ) : null}
            <Field label={reasonDialog?.kind === "atestado-entregar" ? "Observacao interna" : "Motivo"}>
              <Textarea rows={4} value={reasonText} onChange={(event) => setReasonText(event.target.value)} placeholder="Descreva o motivo da acao" />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeReasonDialog} disabled={reasonActionMutation.isPending}>
              Cancelar
            </Button>
            <Button onClick={() => reasonActionMutation.mutate()} disabled={reasonActionMutation.isPending}>
              {reasonActionMutation.isPending ? "Salvando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={!!holeriteSheetId} onOpenChange={(open) => (!open ? setHoleriteSheetId(null) : undefined)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Detalhe do holerite</SheetTitle>
            <SheetDescription>Consulte valores e ajuste acrescimos ou descontos manuais quando necessario.</SheetDescription>
          </SheetHeader>
          {holeriteDetailQuery.isLoading ? (
            <div className="mt-6 space-y-3">
              <Skeleton className="h-20" />
              <Skeleton className="h-72" />
            </div>
          ) : holeriteDetailQuery.data ? (
            <HoleriteDetail
              item={holeriteDetailQuery.data}
              employeeName={funcionarioById.get(holeriteDetailQuery.data.funcionario_id)?.nome}
              loading={saveHoleriteMutation.isPending}
              onSave={(payload) => saveHoleriteMutation.mutate(payload)}
            />
          ) : (
            <div className="mt-6">
              <QueueEmpty text="Nao foi possivel carregar os detalhes do holerite." />
            </div>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => (!open ? setDeleteId(null) : undefined)}
        title="Remover funcionario"
        description="Essa acao remove o cadastro do funcionario selecionado."
        confirmLabel="Remover"
        variant="destructive"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        loading={deleteMutation.isPending}
      />

      <ConfirmDialog
        open={!!localDeleteId}
        onOpenChange={(open) => (!open ? setLocalDeleteId(null) : undefined)}
        title="Remover local de ponto"
        description="O funcionario deixara de poder registrar ponto nesse geofence."
        confirmLabel="Remover"
        variant="destructive"
        onConfirm={() => localDeleteId && deleteLocalMutation.mutate(localDeleteId)}
        loading={deleteLocalMutation.isPending}
      />

      <ConfirmDialog
        open={!!tipoDeleteId}
        onOpenChange={(open) => (!open ? setTipoDeleteId(null) : undefined)}
        title="Remover tipo de atestado"
        description="Use com cuidado para nao quebrar historicos operacionais."
        confirmLabel="Remover"
        variant="destructive"
        onConfirm={() => tipoDeleteId && deleteTipoMutation.mutate(tipoDeleteId)}
        loading={deleteTipoMutation.isPending}
      />

      <ConfirmDialog
        open={closeFolhaConfirmOpen}
        onOpenChange={setCloseFolhaConfirmOpen}
        title="Fechar folha"
        description={`Confirma o fechamento da competencia ${String(competenciaMes).padStart(2, "0")}/${competenciaAno} para ${selectedEmployeeName.toLowerCase()}?`}
        confirmLabel="Fechar folha"
        onConfirm={() => closeFolhaMutation.mutate()}
        loading={closeFolhaMutation.isPending}
      />
    </div>
  );
}

function PontoRow({ item, employeeName }: { item: RhRegistroPonto; employeeName?: string }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-medium">{employeeName ?? item.funcionario_id}</p>
          <p className="text-sm text-muted-foreground">
            {item.tipo === "entrada" ? "Entrada" : "Saida"} em {formatDateTime(item.timestamp)}
          </p>
          <p className="text-xs text-muted-foreground">
            {item.local_ponto_id ? `Local autorizado: ${item.local_ponto_id}` : "Sem local vinculado"}
          </p>
        </div>
        <Badge variant={statusBadgeVariant(item.status)}>{statusLabel(item.status)}</Badge>
      </div>
    </div>
  );
}

function HoleriteRow({
  item,
  employeeName,
  onOpen,
}: {
  item: RhHolerite;
  employeeName?: string;
  onOpen: () => void;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-medium">{employeeName ?? item.funcionario_id}</p>
          <p className="text-sm text-muted-foreground">
            {String(item.mes_referencia).padStart(2, "0")}/{item.ano_referencia}
          </p>
          <p className="text-xs text-muted-foreground">
            Liquido: {formatCurrency(item.valor_liquido)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={statusBadgeVariant(item.status)}>{statusLabel(item.status)}</Badge>
          <Button variant="outline" size="sm" onClick={onOpen}>
            Ver detalhe
          </Button>
        </div>
      </div>
    </div>
  );
}

function HoleriteDetail({
  item,
  employeeName,
  loading,
  onSave,
}: {
  item: RhHolerite;
  employeeName?: string;
  loading: boolean;
  onSave: (payload: { id: string; acrescimos_manuais: string; descontos_manuais: string; motivo: string }) => void;
}) {
  const [acrescimos, setAcrescimos] = useState(item.acrescimos_manuais);
  const [descontos, setDescontos] = useState(item.descontos_manuais);
  const [motivo, setMotivo] = useState("");

  useEffect(() => {
    setAcrescimos(item.acrescimos_manuais);
    setDescontos(item.descontos_manuais);
    setMotivo("");
  }, [item]);

  return (
    <div className="mt-6 space-y-4">
      <Card>
        <CardContent className="grid gap-3 py-4 md:grid-cols-2">
          <Stat label="Funcionario" value={employeeName ?? item.funcionario_id} />
          <Stat label="Competencia" value={`${String(item.mes_referencia).padStart(2, "0")}/${item.ano_referencia}`} />
          <Stat label="Status" value={statusLabel(item.status)} />
          <Stat label="Liquido" value={formatCurrency(item.valor_liquido)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Composicao</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Stat label="Salario base" value={formatCurrency(item.salario_base)} />
          <Stat label="Horas extras" value={formatCurrency(item.horas_extras)} />
          <Stat label="Descontos por falta" value={formatCurrency(item.descontos_falta)} />
          <Stat label="Pagamento agendado" value={item.pagamento_agendado_id ?? "Nao vinculado"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Ajustes manuais</CardTitle>
          <CardDescription>O motivo e obrigatorio para manter a trilha de auditoria completa.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Acrescimos manuais">
              <Input value={acrescimos} onChange={(event) => setAcrescimos(event.target.value)} />
            </Field>
            <Field label="Descontos manuais">
              <Input value={descontos} onChange={(event) => setDescontos(event.target.value)} />
            </Field>
          </div>
          <Field label="Motivo">
            <Textarea rows={3} value={motivo} onChange={(event) => setMotivo(event.target.value)} />
          </Field>
          <div className="flex justify-end">
            <Button
              onClick={() => onSave({ id: item.id, acrescimos_manuais: acrescimos, descontos_manuais: descontos, motivo })}
              disabled={loading}
            >
              {loading ? "Salvando..." : "Salvar ajustes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
