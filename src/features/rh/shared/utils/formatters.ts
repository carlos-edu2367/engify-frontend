import type { RhTurnoHorario } from "@/types/rh.types";

export type RhBadgeVariant = "secondary" | "success" | "warning" | "destructive" | "info";

const statusLabels: Record<string, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
  solicitado: "Solicitado",
  em_andamento: "Em andamento",
  concluido: "Concluido",
  cancelado: "Cancelado",
  aguardando_entrega: "Aguardando entrega",
  entregue: "Entregue",
  vencido: "Vencido",
  rascunho: "Rascunho",
  fechado: "Fechado",
  validado: "Validado",
  negado: "Negado",
  inconsistente: "Inconsistente",
  ajustado: "Ajustado",
  ativo: "Ativo",
  inativo: "Inativo",
};

export function formatCompetence(month: number, year: number) {
  return `${String(month).padStart(2, "0")}/${year}`;
}

export function formatRhCurrency(value: string | number) {
  const parsed = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(parsed) ? parsed : 0);
}

export function formatRhDate(value?: string | null) {
  if (!value) {
    return "Nao informado";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function maskCpf(value?: string | null) {
  const digits = (value ?? "").replace(/\D/g, "");
  if (digits.length < 11) {
    return "***.***.***-**";
  }
  return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`;
}

export function statusLabel(status?: string | null) {
  if (!status) {
    return "Sem status";
  }
  return statusLabels[status] ?? status.replace(/_/g, " ");
}

export function statusBadgeVariant(status?: string | null): RhBadgeVariant {
  if (["aprovado", "entregue", "fechado", "validado", "ajustado", "ativo"].includes(status ?? "")) {
    return "success";
  }
  if (["pendente", "solicitado", "aguardando_entrega", "rascunho", "em_andamento", "inconsistente"].includes(status ?? "")) {
    return "warning";
  }
  if (["rejeitado", "cancelado", "vencido", "negado", "inativo"].includes(status ?? "")) {
    return "destructive";
  }
  return "secondary";
}

export function summarizeSchedule(turnos?: RhTurnoHorario[] | null) {
  const count = turnos?.length ?? 0;
  if (!count) {
    return "Sem jornada";
  }
  if (count === 1) {
    return "1 dia/semana";
  }
  return `${count} dias/semana`;
}
