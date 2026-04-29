import type {
  RhAtestado,
  RhEmployeeDisplayFields,
  RhFuncionarioListItem,
} from "@/types/rh.types";
import { formatRhCurrency, maskCpf } from "./formatters";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const restrictedKeys = new Set([
  "calculation_hash",
  "file_path",
  "ip_hash",
  "request_id",
  "user_agent",
  "access_token",
  "refresh_token",
]);
const salaryKeys = new Set(["salario", "salario_base", "valor_salario", "salary"]);
const cpfKeys = new Set(["cpf", "funcionario_cpf"]);

export function isTechnicalIdentifier(value?: string | null) {
  return uuidPattern.test(value ?? "");
}

export function employeeDisplay(
  item?: Partial<RhEmployeeDisplayFields & RhFuncionarioListItem> | null
) {
  const title = item?.funcionario_nome ?? item?.nome ?? "Funcionario nao identificado";
  const role = item?.funcionario_cargo ?? item?.cargo;
  const cpf = item?.funcionario_cpf_mascarado ?? item?.cpf_mascarado;
  const subtitle = [role, cpf].filter(Boolean).join(" · ");

  return {
    title,
    subtitle: subtitle || "Sem cargo informado",
  };
}

export function safeTipoAtestadoName(item?: Pick<RhAtestado, "tipo_atestado_nome"> | null) {
  return item?.tipo_atestado_nome?.trim() || "Tipo removido";
}

export function humanizeAuditValue(key: string, value: unknown): string {
  const normalizedKey = key.toLowerCase();

  if (restrictedKeys.has(normalizedKey) || normalizedKey.endsWith("_id")) {
    return "Restrito";
  }
  if (cpfKeys.has(normalizedKey)) {
    return maskCpf(String(value ?? ""));
  }
  if (salaryKeys.has(normalizedKey) || normalizedKey.includes("salario")) {
    return "Valor sensivel";
  }
  if (typeof value === "boolean") {
    return value ? "Sim" : "Nao";
  }
  if (value == null || value === "") {
    return "Nao informado";
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (typeof value === "string" && isTechnicalIdentifier(value)) {
    return "Restrito";
  }
  if (normalizedKey.includes("valor") && (typeof value === "string" || typeof value === "number")) {
    return formatRhCurrency(value);
  }
  if (typeof value === "object") {
    return "Conteudo detalhado";
  }
  return String(value);
}

export function humanizeAuditRecord(record?: Record<string, unknown> | null) {
  if (!record) {
    return [];
  }

  return Object.entries(record)
    .filter(([key]) => !restrictedKeys.has(key.toLowerCase()))
    .map(([key, value]) => ({
      label: key.replace(/_/g, " "),
      value: humanizeAuditValue(key, value),
    }));
}
