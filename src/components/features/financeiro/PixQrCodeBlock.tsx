import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Check, Copy, QrCode, ScanQrCode } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PixQrCodeBlockProps {
  payload: string;
  originalCode?: string;
  compact?: boolean;
}

export function PixQrCodeBlock({ payload, originalCode, compact = false }: PixQrCodeBlockProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    QRCode.toDataURL(payload, {
      width: compact ? 128 : 176,
      margin: 1,
      errorCorrectionLevel: "M",
    })
      .then((url: string) => {
        if (!cancelled) {
          setQrDataUrl(url);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQrDataUrl(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [compact, payload]);

  function handleCopy() {
    navigator.clipboard.writeText(payload).then(() => {
      setCopied(true);
      toast.success("PIX Copia e Cola copiado!");
      window.setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <>
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <QrCode className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                PIX via QR Code
              </p>
            </div>
            {originalCode && originalCode !== payload && (
              <p className="mt-1 break-all text-[11px] text-muted-foreground">
                Chave original: {originalCode}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-emerald-300"
              onClick={handleCopy}
              title="Copiar PIX Copia e Cola"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
            {qrDataUrl && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-emerald-300"
                onClick={() => setExpanded(true)}
                title="Ampliar QR Code"
              >
                <ScanQrCode className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          {qrDataUrl ? (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="w-fit rounded-lg border border-emerald-500/20 bg-white p-2"
              title="Ampliar QR Code"
            >
              <img
                src={qrDataUrl}
                alt="QR Code PIX"
                className={compact ? "h-24 w-24" : "h-32 w-32"}
              />
            </button>
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed border-emerald-500/20 text-[11px] text-muted-foreground">
              QR indisponível
            </div>
          )}

          <div className="min-w-0 flex-1 space-y-2">
            <p className="break-all rounded-md border border-border bg-background/80 px-3 py-2 font-mono text-[11px] text-foreground/80">
              {payload}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Escaneie o QR Code no app do banco ou copie o código para pagar.
            </p>
          </div>
        </div>
      </div>

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code PIX</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            {qrDataUrl && (
              <div className="rounded-xl border bg-white p-3">
                <img src={qrDataUrl} alt="QR Code PIX ampliado" className="h-64 w-64" />
              </div>
            )}
            <Button type="button" onClick={handleCopy} className="gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              Copiar PIX Copia e Cola
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
