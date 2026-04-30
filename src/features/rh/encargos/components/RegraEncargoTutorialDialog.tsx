import { BookOpen, CalendarClock, Calculator, CheckCircle2, ListChecks, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const fieldGroups = [
  {
    icon: BookOpen,
    title: "Identificacao",
    items: [
      "Nome aparece no holerite e deve ser claro para conferencia.",
      "Codigo agrupa regras equivalentes. Se duas regras ativas tiverem o mesmo codigo, a mais especifica prevalece.",
      "Descricao e opcional; use para registrar o motivo administrativo da regra.",
    ],
  },
  {
    icon: Calculator,
    title: "Calculo",
    items: [
      "Tipo percentual simples calcula a base multiplicada pela aliquota informada.",
      "Tipo valor fixo usa exatamente o valor informado, sem depender da base.",
      "Tipo tabela progressiva usa uma tabela cadastrada em Tabelas progressivas.",
      "Base de calculo define de onde sai o valor usado no calculo: salario base, salario com extras, bruto antes dos encargos, bruto antes do IRRF, liquido parcial ou referencia manual.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Efeito na folha",
    items: [
      "Natureza provento soma ao funcionario, desconto abate do liquido e informativo apenas registra o valor.",
      "Prioridade controla a ordem de aplicacao: numeros menores rodam primeiro.",
      "Piso e teto, quando configurados pela regra, limitam o valor calculado.",
    ],
  },
  {
    icon: CalendarClock,
    title: "Vigencia",
    items: [
      "Inicio da vigencia e obrigatorio para ativar a regra.",
      "Fim da vigencia e opcional; sem fim, a regra continua valendo ate ser inativada.",
      "O sistema bloqueia ativacao quando existe outra regra ativa com mesmo codigo, periodo e aplicabilidade.",
    ],
  },
  {
    icon: ListChecks,
    title: "Aplicabilidade",
    items: [
      "Sem aplicabilidade informada, a regra vale para todos os funcionarios.",
      "Aplicabilidade por funcionario tem prioridade sobre regras gerais do mesmo codigo.",
      "Aplicabilidades por cargo, contrato, empresa ou tag podem ser registradas para regras mais segmentadas.",
    ],
  },
  {
    icon: CheckCircle2,
    title: "Depois de salvar",
    items: [
      "A regra nasce como rascunho para revisao.",
      "Enquanto estiver em rascunho, pode ser ajustada antes da ativacao.",
      "Para entrar no calculo da folha, ela precisa ser ativada com uma justificativa.",
    ],
  },
];

export function RegraEncargoTutorialDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Como criar uma regra de encargo?</DialogTitle>
          <DialogDescription>
            Use este guia para preencher a regra com seguranca antes de ativar o calculo em folha.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 md:grid-cols-2">
          {fieldGroups.map((group) => {
            const Icon = group.icon;

            return (
              <section key={group.title} className="rounded-lg border p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Icon className="size-4 text-primary" />
                  <h3 className="text-sm font-semibold">{group.title}</h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {group.items.map((item) => (
                    <li key={item} className="leading-relaxed">
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>

        <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
          Exemplo comum: Vale transporte como desconto, tipo percentual simples, base salario base,
          percentual 6, prioridade 100 e vigencia iniciando no primeiro dia da competencia.
        </div>
      </DialogContent>
    </Dialog>
  );
}
