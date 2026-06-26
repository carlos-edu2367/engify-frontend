import type { RhRegistroPonto } from "@/types/rh.types";

export type PunchRole =
  | "jornada-entrada"
  | "jornada-saida"
  | "intervalo-inicio"
  | "intervalo-fim"
  | "neutro";

export const punchRoleLabel: Record<PunchRole, string> = {
  "jornada-entrada": "Entrada",
  "jornada-saida": "Saida",
  "intervalo-inicio": "Saida p/ intervalo",
  "intervalo-fim": "Volta do intervalo",
  neutro: "",
};

export const intervalRoles: ReadonlySet<PunchRole> = new Set<PunchRole>([
  "intervalo-inicio",
  "intervalo-fim",
]);

function localDayKey(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function classifyDayPunches(registros: RhRegistroPonto[]): Map<string, PunchRole> {
  const roles = new Map<string, PunchRole>();
  const byDay = new Map<string, RhRegistroPonto[]>();

  for (const registro of registros) {
    const key = `${registro.funcionario_id}:${localDayKey(registro.timestamp)}`;
    const bucket = byDay.get(key) ?? [];
    bucket.push(registro);
    byDay.set(key, bucket);
  }

  for (const bucket of byDay.values()) {
    const sorted = [...bucket].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    if (sorted.length < 2 || sorted.length % 2 !== 0) {
      for (const registro of sorted) roles.set(registro.id, "neutro");
      continue;
    }

    sorted.forEach((registro, index) => {
      if (index === 0) {
        roles.set(registro.id, "jornada-entrada");
      } else if (index === sorted.length - 1) {
        roles.set(registro.id, "jornada-saida");
      } else if (registro.tipo === "saida") {
        roles.set(registro.id, "intervalo-inicio");
      } else {
        roles.set(registro.id, "intervalo-fim");
      }
    });
  }

  return roles;
}
