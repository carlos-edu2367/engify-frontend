import { Share, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function InstallAppDialog({
  open,
  onOpenChange,
  isIOS,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isIOS: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Instalar o Engify</DialogTitle>
          <DialogDescription>
            {isIOS
              ? "No iPhone/iPad, adicione o Engify à tela de início pelo Safari."
              : "Adicione o Engify ao seu dispositivo para abrir como aplicativo."}
          </DialogDescription>
        </DialogHeader>
        {isIOS ? (
          <ol className="flex flex-col gap-3 text-sm">
            <li className="flex items-center gap-2">1. Toque em <Share className="size-4" /> <strong>Compartilhar</strong> no Safari.</li>
            <li className="flex items-center gap-2">2. Escolha <Plus className="size-4" /> <strong>Adicionar à Tela de Início</strong>.</li>
            <li>3. Confirme em <strong>Adicionar</strong>.</li>
          </ol>
        ) : (
          <ol className="flex flex-col gap-3 text-sm">
            <li>1. Abra o menu do navegador (⋮).</li>
            <li>2. Toque em <strong>Instalar aplicativo</strong> / <strong>Adicionar à tela inicial</strong>.</li>
            <li>3. Confirme. O Engify abrirá como app.</li>
          </ol>
        )}
      </DialogContent>
    </Dialog>
  );
}
