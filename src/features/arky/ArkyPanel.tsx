import { useCallback, useRef, useState } from "react";
import { Camera, Send, X } from "lucide-react";
import { arkyService } from "./arky.service";
import { ArkyMessageList } from "./ArkyMessageList";
import { captureViewport } from "./screenshot-capture";
import { useArkyScreenContext } from "./useArkyContext";
import type { ArkyMessage, ArkyStreamEvent } from "./arky.types";

interface ArkyPanelProps {
  onClose: () => void;
}

export function ArkyPanel({ onClose }: ArkyPanelProps) {
  const [messages, setMessages] = useState<ArkyMessage[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [screenshotPending, setScreenshotPending] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamEvents, setStreamEvents] = useState<ArkyStreamEvent[]>([]);
  const [sendError, setSendError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const streamEventsRef = useRef<ArkyStreamEvent[]>([]);
  const screenCtx = useArkyScreenContext();

  const appendStreamEvent = useCallback((event: ArkyStreamEvent) => {
    streamEventsRef.current = [...streamEventsRef.current, event];
    setStreamEvents(streamEventsRef.current);
  }, []);

  const handleSend = useCallback(
    async (withScreenshot = false) => {
      const text = input.trim();
      if (!text || isStreaming || screenshotPending) return;

      setInput("");
      setSendError(null);
      setIsStreaming(true);
      streamEventsRef.current = [];
      setStreamEvents([]);

      const userMsg: ArkyMessage = {
        id: `local-${Date.now()}`,
        role: "user",
        content: text,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);

      let screenshot: string | null = null;

      if (withScreenshot) {
        appendStreamEvent({
          type: "status",
          status: "capturando_screenshot",
          label: "Capturando tela",
        });
        setScreenshotPending(true);
        try {
          const result = await captureViewport();
          screenshot = result?.base64 ?? null;
          appendStreamEvent({
            type: "status",
            status: screenshot ? "screenshot_anexado" : "screenshot_indisponivel",
            label: screenshot ? "Captura anexada" : "Captura indisponivel",
            summary: screenshot ? "Imagem reduzida e redigida antes do envio." : "A mensagem sera enviada sem imagem.",
          });
        } finally {
          setScreenshotPending(false);
        }
      }

      let finalHandled = false;
      try {
        const finalData = await arkyService.chatStream(
          {
            message: text,
            screen: screenCtx,
            conversation_id: conversationId,
            screenshot,
          },
          (event) => {
            appendStreamEvent(event);
            if (event.type !== "final" || !event.data) return;

            finalHandled = true;
            setConversationId(event.data.conversation_id);
            const assistantMsg: ArkyMessage = {
              id: event.data.message_id,
              role: "assistant",
              content: event.data.message,
              timestamp: new Date(),
              cards: event.data.cards,
              actions: event.data.actions,
              citations: event.data.citations,
              events: streamEventsRef.current,
            };
            setMessages((prev) => [...prev, assistantMsg]);
          }
        );

        if (finalData && !finalHandled) {
          setConversationId(finalData.conversation_id);
          setMessages((prev) => [
            ...prev,
            {
              id: finalData.message_id,
              role: "assistant",
              content: finalData.message,
              timestamp: new Date(),
              cards: finalData.cards,
              actions: finalData.actions,
              citations: finalData.citations,
              events: streamEventsRef.current,
            },
          ]);
        }
      } catch {
        setSendError("Erro ao enviar mensagem. Tente novamente.");
      } finally {
        setIsStreaming(false);
      }
    },
    [appendStreamEvent, conversationId, input, isStreaming, screenCtx, screenshotPending]
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const isLoading = isStreaming || screenshotPending;
  const module = screenCtx.module;
  const screenshotBlocked = module === "financeiro" || module === "rh";

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary">
            <span className="text-xs font-bold text-primary-foreground">A</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Arky</p>
            <p className="text-[10px] text-muted-foreground">
              {screenCtx.title} · {screenCtx.module}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
          aria-label="Fechar Arky"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <ArkyMessageList
        messages={messages}
        isLoading={isLoading}
        events={streamEvents}
        onActionConfirmed={(id) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.cards?.some((c) => c.action_preview_id === id)
                ? { ...m, cards: m.cards?.map((c) => c.action_preview_id === id ? { ...c, _confirmed: true } : c) }
                : m
            )
          );
        }}
      />

      {/* Error banner */}
      {sendError && (
        <div className="mx-3 mb-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {sendError}
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte algo sobre o Engify..."
            rows={1}
            disabled={isLoading}
            className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
            style={{ maxHeight: "120px", overflowY: "auto" }}
          />
          <div className="flex shrink-0 items-center gap-1">
            {!screenshotBlocked && (
              <button
                onClick={() => handleSend(true)}
                disabled={!input.trim() || isLoading}
                title="Enviar com captura de tela (ajuda visual)"
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
              >
                <Camera className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => handleSend(false)}
              disabled={!input.trim() || isLoading}
              className="rounded-md bg-primary p-1.5 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
          Arky não toma ações sem sua confirmação
        </p>
      </div>
    </div>
  );
}
