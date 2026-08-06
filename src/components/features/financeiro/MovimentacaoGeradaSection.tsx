import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AttachmentManager } from "@/components/features/financeiro/AttachmentManager";
import { usePagamentoComprovacao } from "@/hooks/useFinanceiro";
import { formatCurrency, formatLocalDateTime } from "@/lib/utils";

export interface MovimentacaoGeradaSectionProps {
  pagamentoId: string;
  /** Só busca quando o card está expandido, para não disparar N requisições. */
  enabled: boolean;
}

/**
 * Mostra, em modo somente leitura, a movimentacao gerada pela baixa do
 * pagamento e os anexos que o usuario atual pode ver. O backend ja sanitiza o
 * caso de baixa em lote — aqui nao ha nenhuma decisao de permissao.
 */
export function MovimentacaoGeradaSection({
  pagamentoId, enabled,
}: MovimentacaoGeradaSectionProps) {
  const { data, isLoading } = usePagamentoComprovacao(pagamentoId, enabled);

  if (isLoading) return <Skeleton className="h-24 rounded-lg" />;
  if (!data?.movimentacao) return null;

  const { movimentacao, attachments } = data;

  return (
    <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Movimentacao gerada
        </p>
        {movimentacao.is_lote && (
          <Badge variant="outline" className="text-[10px]">
            Baixa em lote
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="text-sm font-medium text-foreground">{movimentacao.title}</span>
        <span>{formatCurrency(movimentacao.valor)}</span>
        <span>{formatLocalDateTime(movimentacao.data_movimentacao)}</span>
      </div>

      <AttachmentManager
        attachments={attachments}
        isLoading={false}
        isUploading={false}
        onUploadFiles={async () => {}}
        onDeleteAttachment={async () => {}}
        disabled
        label="Anexos da movimentacao"
        emptyTitle="Nenhum anexo na movimentacao"
        emptyHint="Documentos e comprovantes aparecem aqui"
      />
    </div>
  );
}
