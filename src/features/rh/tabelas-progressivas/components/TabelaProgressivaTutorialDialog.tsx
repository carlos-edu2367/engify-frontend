import { Calculator, CalendarClock, CheckCircle2, Layers3, ListOrdered, Percent } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const sections = [
  {
    icon: Calculator,
    title: "Para que serve",
    items: [
      "A tabela progressiva guarda faixas de calculo para regras do tipo progressivo.",
      "Ela nao calcula sozinha; uma regra de encargo escolhe esta tabela e define a base usada na folha.",
      "Exemplos comuns sao INSS, IRRF ou qualquer desconto por faixas.",
    ],
  },
  {
    icon: CalendarClock,
    title: "Identificacao e vigencia",
    items: [
      "Nome e codigo identificam a tabela na regra de encargo.",
      "Inicio da vigencia e obrigatorio para ativar a tabela.",
      "Fim da vigencia e opcional; use quando a tabela tiver prazo para ser substituida.",
      "A data final nunca pode ser anterior ao inicio.",
    ],
  },
  {
    icon: ListOrdered,
    title: "Faixas",
    items: [
      "Valor inicial e o menor valor da base que entra naquela faixa.",
      "Valor final e o limite superior; deixe vazio na ultima faixa para cobrir valores maiores.",
      "As faixas sao ordenadas pelo valor inicial e nao podem se sobrepor.",
      "O sistema envia uma ordem unica para cada faixa depois de organizar os limites.",
    ],
  },
  {
    icon: Percent,
    title: "Aliquota e deducao",
    items: [
      "Aliquota precisa ficar entre 0 e 100.",
      "Deducao reduz o resultado quando a tabela usa aliquota efetiva.",
      "Sem calculo marginal, o valor e base multiplicada pela aliquota da faixa menos a deducao.",
    ],
  },
  {
    icon: Layers3,
    title: "Calculo marginal",
    items: [
      "Quando qualquer faixa marca calculo marginal, o motor calcula por parcelas de cada faixa.",
      "Nesse modo, a deducao configurada nas faixas nao entra no resultado.",
      "Use marginal quando cada trecho da base deve ter uma aliquota propria.",
    ],
  },
  {
    icon: CheckCircle2,
    title: "Depois de salvar",
    items: [
      "A tabela nasce como rascunho.",
      "As faixas ficam vinculadas ao rascunho e podem ser revisadas antes da ativacao.",
      "Para ser usada por uma regra ativa, a tabela precisa ser ativada com uma justificativa.",
    ],
  },
];

export function TabelaProgressivaTutorialDialog({
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
          <DialogTitle>Como criar uma tabela progressiva?</DialogTitle>
          <DialogDescription>
            Use este guia para montar faixas coerentes antes de ligar a tabela a uma regra de encargo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 md:grid-cols-2">
          {sections.map((section) => {
            const Icon = section.icon;

            return (
              <section key={section.title} className="rounded-lg border p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Icon className="size-4 text-primary" />
                  <h3 className="text-sm font-semibold">{section.title}</h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {section.items.map((item) => (
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
          Exemplo comum: faixa 0 a 1500 com aliquota 0, faixa 1500.01 a 3000 com
          aliquota 7.5 e deducao correspondente, e ultima faixa sem valor final.
        </div>
      </DialogContent>
    </Dialog>
  );
}
