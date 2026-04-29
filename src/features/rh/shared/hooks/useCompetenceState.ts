import { useMemo, useState } from "react";

const STORAGE_KEY = "engify.rh.competence";

function clampMonth(month: number) {
  if (!Number.isFinite(month)) {
    return new Date().getMonth() + 1;
  }
  return Math.min(12, Math.max(1, month));
}

function readStoredCompetence(initialDate: Date) {
  if (typeof window === "undefined") {
    return {
      month: initialDate.getMonth() + 1,
      year: initialDate.getFullYear(),
    };
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {
        month: initialDate.getMonth() + 1,
        year: initialDate.getFullYear(),
      };
    }
    const parsed = JSON.parse(stored) as { month?: number; year?: number };
    return {
      month: clampMonth(Number(parsed.month)),
      year: Number(parsed.year) || initialDate.getFullYear(),
    };
  } catch {
    return {
      month: initialDate.getMonth() + 1,
      year: initialDate.getFullYear(),
    };
  }
}

function storeCompetence(month: number, year: number) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ month, year }));
  } catch {
    // Prefer keeping the UI usable when storage is blocked.
  }
}

export function useCompetenceState(initialDate = new Date()) {
  const [state, setState] = useState(() => readStoredCompetence(initialDate));

  const competence = useMemo(() => ({ month: state.month, year: state.year }), [state.month, state.year]);

  const setMonth = (month: number) => {
    setState((current) => {
      const next = { ...current, month: clampMonth(month) };
      storeCompetence(next.month, next.year);
      return next;
    });
  };

  const setYear = (year: number) => {
    setState((current) => {
      const next = { ...current, year: Number(year) || current.year };
      storeCompetence(next.month, next.year);
      return next;
    });
  };

  return {
    competence,
    month: state.month,
    year: state.year,
    setMonth,
    setYear,
  };
}
