import { useState } from "react";
import { useObraFinanceiroResumo } from "@/hooks/useObraFinanceiro";
import { ResultadoHero } from "./ResultadoHero";
import { ResumoStatRow } from "./ResumoStatRow";
import { CustosPorClasse } from "./CustosPorClasse";
import { MovimentacoesObraList } from "./MovimentacoesObraList";
import { RegistrarSaidaDialog } from "./RegistrarSaidaDialog";

interface ObraFinanceiroTabProps {
  obraId: string;
  onDefinirContrato: () => void;
  onIrParaRecebimentos: () => void;
}

export function ObraFinanceiroTab({
  obraId,
  onDefinirContrato,
  onIrParaRecebimentos,
}: ObraFinanceiroTabProps) {
  const [registrarSaidaOpen, setRegistrarSaidaOpen] = useState(false);

  const { data: resumo, isLoading, isError, refetch } = useObraFinanceiroResumo(obraId);

  return (
    <div className="space-y-8">
      <ResultadoHero
        resumo={resumo}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        onDefinirContrato={onDefinirContrato}
        onRegistrarSaida={() => setRegistrarSaidaOpen(true)}
      />

      <ResumoStatRow resumo={resumo} isLoading={isLoading} />

      <CustosPorClasse itens={resumo?.custos_por_classe} isLoading={isLoading} />

      <MovimentacoesObraList
        obraId={obraId}
        onRegistrarSaida={() => setRegistrarSaidaOpen(true)}
      />

      <RegistrarSaidaDialog
        obraId={obraId}
        open={registrarSaidaOpen}
        onOpenChange={setRegistrarSaidaOpen}
        onIrParaRecebimentos={onIrParaRecebimentos}
      />
    </div>
  );
}
