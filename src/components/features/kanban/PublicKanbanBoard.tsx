/**
 * PublicKanbanBoard — kanban somente leitura para o painel público do cliente.
 *
 * Sem drag-and-drop, sem ações, sem chamadas de API adicionais.
 * Recebe itens já carregados como prop (vindos do endpoint público).
 * Clique em um card abre um drawer com as fotos do item.
 */
import { useState } from "react";
import { ImageIcon, X, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { PublicItemView, PublicItemAttachmentView, ObraStatus } from "@/types/obra.types";

// ── Constantes ─────────────────────────────────────────────────────────────────

const STATUSES: ObraStatus[] = ["planejamento", "em_andamento", "finalizado"];

const COLUMN_CONFIG: Record<ObraStatus, { label: string; dot: string }> = {
  planejamento: { label: "Planejamento", dot: "bg-slate-500" },
  em_andamento: { label: "Em Andamento", dot: "bg-blue-500" },
  finalizado:   { label: "Finalizado",   dot: "bg-emerald-500" },
};

// ── Lightbox simples ───────────────────────────────────────────────────────────

function Lightbox({
  attachments,
  initialIndex,
  onClose,
}: {
  attachments: PublicItemAttachmentView[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const current = attachments[index];

  function prev(e: React.MouseEvent) {
    e.stopPropagation();
    setIndex((i) => Math.max(0, i - 1));
  }

  function next(e: React.MouseEvent) {
    e.stopPropagation();
    setIndex((i) => Math.min(attachments.length - 1, i + 1));
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        onClick={onClose}
        aria-label="Fechar"
      >
        <X className="h-4 w-4" />
      </button>

      {attachments.length > 1 && (
        <>
          <button
            className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors",
              index === 0 && "opacity-30 pointer-events-none"
            )}
            onClick={prev}
            aria-label="Anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors",
              index === attachments.length - 1 && "opacity-30 pointer-events-none"
            )}
            onClick={next}
            aria-label="Próxima"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      <div className="flex flex-col items-center gap-3 max-h-full" onClick={(e) => e.stopPropagation()}>
        <img
          src={current.download_url}
          alt={current.file_name}
          className="max-h-[80vh] max-w-full rounded-lg shadow-2xl object-contain"
        />
        {attachments.length > 1 && (
          <p className="text-xs text-white/50">
            {index + 1} / {attachments.length}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Card público ───────────────────────────────────────────────────────────────

function PublicCard({
  item,
  onClick,
}: {
  item: PublicItemView;
  onClick: () => void;
}) {
  const hasPhotos = item.attachments.length > 0;
  const preview = item.attachments.slice(0, 3);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-lg border bg-card p-3 shadow-sm transition-shadow",
        hasPhotos
          ? "hover:shadow-md cursor-pointer"
          : "cursor-default"
      )}
    >
      <p className="text-sm font-medium leading-tight">{item.title}</p>

      {hasPhotos && (
        <div className="mt-2 flex gap-1.5">
          {preview.map((att, i) => (
            <div
              key={att.id}
              className="relative h-14 w-14 shrink-0 rounded-md overflow-hidden border border-border/50 bg-muted/30"
            >
              <img
                src={att.download_url}
                alt={att.file_name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              {/* Indicador de fotos extras */}
              {i === 2 && item.attachments.length > 3 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-[10px] font-semibold text-white">
                    +{item.attachments.length - 3}
                  </span>
                </div>
              )}
            </div>
          ))}

          <div className="flex items-end pb-0.5">
            <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
              <ZoomIn className="h-3 w-3" />
              {item.attachments.length} foto{item.attachments.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      )}
    </button>
  );
}

// ── Coluna pública ─────────────────────────────────────────────────────────────

function PublicColumn({
  status,
  items,
  onCardClick,
  className,
}: {
  status: ObraStatus;
  items: PublicItemView[];
  onCardClick: (item: PublicItemView) => void;
  className?: string;
}) {
  const config = COLUMN_CONFIG[status];

  return (
    <div
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-xl border bg-muted/40 p-3",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", config.dot)} />
        <span className="text-sm font-semibold flex-1">{config.label}</span>
        <span className="text-xs text-muted-foreground bg-background rounded-full px-2 py-0.5">
          {items.length}
        </span>
      </div>

      <div className="flex flex-col gap-2 flex-1 min-h-[60px]">
        {items.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-xs text-muted-foreground/50">
            Nenhum item
          </div>
        ) : (
          items.map((item) => (
            <PublicCard
              key={item.id}
              item={item}
              onClick={() => onCardClick(item)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── Board principal ────────────────────────────────────────────────────────────

interface PublicKanbanBoardProps {
  items: PublicItemView[];
}

export function PublicKanbanBoard({ items }: PublicKanbanBoardProps) {
  const [activeStatus, setActiveStatus] = useState<ObraStatus>("planejamento");
  const [selectedItem, setSelectedItem] = useState<PublicItemView | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const grouped: Record<ObraStatus, PublicItemView[]> = {
    planejamento: [],
    em_andamento: [],
    finalizado: [],
  };
  for (const item of items) {
    grouped[item.status].push(item);
  }

  function openCard(item: PublicItemView) {
    if (item.attachments.length === 0) return;
    setSelectedItem(item);
  }

  function openLightbox(index: number) {
    setLightboxIndex(index);
  }

  function closeLightbox() {
    setLightboxIndex(null);
  }

  return (
    <>
      {/* Mobile: seletor de coluna */}
      <div className="flex gap-2 overflow-x-auto pb-1 md:hidden scrollbar-none">
        {STATUSES.map((s) => (
          <Button
            key={s}
            type="button"
            variant={activeStatus === s ? "default" : "outline"}
            className="h-10 shrink-0 whitespace-nowrap px-4 text-sm"
            onClick={() => setActiveStatus(s)}
          >
            {COLUMN_CONFIG[s].label}
            <span className="ml-2 rounded-full bg-background/90 px-2 py-0.5 text-xs text-foreground">
              {grouped[s].length}
            </span>
          </Button>
        ))}
      </div>

      {/* Mobile: coluna ativa */}
      <div className="md:hidden">
        <PublicColumn
          status={activeStatus}
          items={grouped[activeStatus]}
          onCardClick={openCard}
          className="w-full"
        />
      </div>

      {/* Desktop: 3 colunas */}
      <div className="hidden md:flex gap-4 overflow-x-auto pb-2">
        {STATUSES.map((s) => (
          <PublicColumn
            key={s}
            status={s}
            items={grouped[s]}
            onCardClick={openCard}
          />
        ))}
      </div>

      {/* Modal de fotos do item */}
      {selectedItem && (
        <Dialog
          open={!!selectedItem}
          onOpenChange={(open) => { if (!open) { setSelectedItem(null); setLightboxIndex(null); } }}
        >
          <DialogContent className="max-w-lg w-full max-h-[90dvh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader className="mb-3">
              <DialogTitle className="text-base leading-snug pr-6">
                {selectedItem.title}
              </DialogTitle>
            </DialogHeader>

            {selectedItem.attachments.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {selectedItem.attachments.map((att, i) => (
                  <button
                    key={att.id}
                    type="button"
                    className="group relative aspect-square rounded-lg overflow-hidden border border-border/50 bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => openLightbox(i)}
                  >
                    <img
                      src={att.download_url}
                      alt={att.file_name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <ZoomIn className="h-5 w-5 text-white drop-shadow" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center mb-3">
                  <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground">Nenhuma foto neste item</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Lightbox de foto ampliada */}
      {selectedItem && lightboxIndex !== null && (
        <Lightbox
          attachments={selectedItem.attachments}
          initialIndex={lightboxIndex}
          onClose={closeLightbox}
        />
      )}
    </>
  );
}
