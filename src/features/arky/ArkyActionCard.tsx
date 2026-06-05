import { useState } from "react";
import { CheckCircle, XCircle, ExternalLink, AlertTriangle, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { arkyService } from "./arky.service";
import type { ArkyActionResponse, ArkyCardResponse, RiskLevel } from "./arky.types";

interface ArkyActionCardProps {
  card: ArkyCardResponse;
  actions?: ArkyActionResponse[];
  onConfirmed?: (previewId: string) => void;
  onRejected?: (previewId: string) => void;
}

const riskConfig: Record<
  RiskLevel,
  { label: string; color: string; icon: React.ReactNode }
> = {
  leitura: { label: "Leitura", color: "text-blue-600", icon: <Info className="h-3 w-3" /> },
  sugestao: { label: "Sugestão", color: "text-green-600", icon: <Info className="h-3 w-3" /> },
  preparacao: { label: "Preparação", color: "text-amber-600", icon: <AlertTriangle className="h-3 w-3" /> },
  escrita_sensivel: { label: "Escrita sensível", color: "text-orange-600", icon: <AlertTriangle className="h-3 w-3" /> },
  bloqueado: { label: "Bloqueado", color: "text-red-600", icon: <XCircle className="h-3 w-3" /> },
};

export function ArkyActionCard({
  card,
  actions = [],
  onConfirmed,
  onRejected,
}: ArkyActionCardProps) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"idle" | "confirmed" | "rejected">("idle");
  const risk = (card.risk as RiskLevel) in riskConfig ? (card.risk as RiskLevel) : "leitura";
  const riskInfo = riskConfig[risk];

  const confirmMutation = useMutation({
    mutationFn: (previewId: string) => arkyService.confirm(previewId),
    onSuccess: (data) => {
      setStatus("confirmed");
      onConfirmed?.(data.action_preview_id);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (previewId: string) => arkyService.reject(previewId),
    onSuccess: (data) => {
      setStatus("rejected");
      onRejected?.(data.action_preview_id);
    },
  });

  const confirmActions = actions.filter((a) => a.type === "confirm_action");
  const deepLinks = actions.filter((a) => a.type === "deep_link");

  const pagamentoItens = Array.isArray(card.data?.itens) ? card.data!.itens! : [];
  const brl = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
  const formatData = (iso?: string | null) => {
    if (!iso) return null;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString("pt-BR");
  };

  function handleConfirm() {
    const confirmAction = confirmActions[0] ?? actions.find((a) => a.action_preview_id);
    const previewId = confirmAction?.action_preview_id ?? card.action_preview_id;
    if (previewId) {
      confirmMutation.mutate(previewId);
    }
  }

  function handleReject() {
    const previewId =
      (confirmActions[0]?.action_preview_id ?? card.action_preview_id) ?? "";
    if (previewId) {
      rejectMutation.mutate(previewId);
    }
  }

  return (
    <div className="my-2 rounded-lg border border-border bg-card p-3 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{card.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{card.summary}</p>
        </div>
        <div className={`flex shrink-0 items-center gap-1 text-xs ${riskInfo.color}`}>
          {riskInfo.icon}
          <span>{riskInfo.label}</span>
        </div>
      </div>

      {/* Detalhes dos pagamentos a agendar */}
      {pagamentoItens.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {pagamentoItens.map((item, i) => (
            <div
              key={i}
              className="flex items-start justify-between gap-2 rounded-md border border-border/60 bg-muted/40 px-2.5 py-1.5"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-foreground">{item.title}</p>
                <p className="mt-0.5 flex flex-wrap gap-x-2 text-[11px] text-muted-foreground">
                  <span className="capitalize">{item.classe}</span>
                  {formatData(item.data_agendada) && <span>· {formatData(item.data_agendada)}</span>}
                  {item.diarist_nome && <span>· {item.diarist_nome}</span>}
                  {item.obra_title && <span>· {item.obra_title}</span>}
                  {item.tem_codigo_pagamento && <span>· Pix ✓</span>}
                </p>
              </div>
              <span className="shrink-0 text-xs font-semibold text-foreground">
                {brl(item.valor)}
              </span>
            </div>
          ))}
          {typeof card.data?.total === "number" && (
            <div className="flex justify-between border-t border-border/60 px-2.5 pt-1.5 text-xs font-semibold text-foreground">
              <span>Total ({card.data?.quantidade ?? pagamentoItens.length})</span>
              <span>{brl(card.data.total)}</span>
            </div>
          )}
        </div>
      )}

      {/* Status feedback */}
      {status === "confirmed" && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-green-600">
          <CheckCircle className="h-3.5 w-3.5" />
          <span>Ação confirmada</span>
        </div>
      )}
      {status === "rejected" && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <XCircle className="h-3.5 w-3.5" />
          <span>Ação cancelada</span>
        </div>
      )}

      {/* Action buttons */}
      {status === "idle" && (
        <div className="mt-3 flex flex-wrap gap-2">
          {card.requires_confirmation && (
            <>
              <button
                onClick={handleConfirm}
                disabled={confirmMutation.isPending}
                className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <CheckCircle className="h-3 w-3" />
                {confirmMutation.isPending ? "Confirmando..." : "Confirmar"}
              </button>
              <button
                onClick={handleReject}
                disabled={rejectMutation.isPending}
                className="flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
              >
                <XCircle className="h-3 w-3" />
                Cancelar
              </button>
            </>
          )}
          {deepLinks.map((action, i) =>
            action.to ? (
              <button
                key={i}
                onClick={() => navigate(action.to!)}
                className="flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
              >
                <ExternalLink className="h-3 w-3" />
                {action.label}
              </button>
            ) : null
          )}
        </div>
      )}

      {(confirmMutation.isError || rejectMutation.isError) && (
        <p className="mt-2 text-xs text-destructive">
          Erro ao processar. Tente novamente.
        </p>
      )}
    </div>
  );
}
