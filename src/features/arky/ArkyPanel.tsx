import { useCallback, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Camera, Send, X } from "lucide-react";
import { arkyService } from "./arky.service";
import { ArkyMessageList } from "./ArkyMessageList";
import { captureViewport } from "./screenshot-capture";
import { useArkyScreenContext } from "./useArkyContext";
import type { ArkyMessage, ArkyChatResponse } from "./arky.types";

interface ArkyPanelProps {
  onClose: () => void;
}

export function ArkyPanel({ onClose }: ArkyPanelProps) {
  const [messages, setMessages] = useState<ArkyMessage[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [screenshotPending, setScreenshotPending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const screenCtx = useArkyScreenContext();

  const chatMutation = useMutation({
    mutationFn: arkyService.chat,
    onSuccess: (data: ArkyChatResponse) => {
      if (!conversationId) setConversationId(data.conversation_id);

      const assistantMsg: ArkyMessage = {
        id: data.message_id,
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
        cards: data.cards,
        actions: data.actions,
        citations: data.citations,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    },
  });

  const handleSend = useCallback(
    async (withScreenshot = false) => {
      const text = input.trim();
      if (!text || chatMutation.isPending) return;

      setInput("");

      const userMsg: ArkyMessage = {
        id: `local-${Date.now()}`,
        role: "user",
        content: text,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);

      let screenshot: string | null = null;

      if (withScreenshot) {
        setScreenshotPending(true);
        try {
          const result = await captureViewport();
          screenshot = result?.base64 ?? null;
        } finally {
          setScreenshotPending(false);
        }
      }

      chatMutation.mutate({
        message: text,
        screen: screenCtx,
        conversation_id: conversationId,
        screenshot,
      });
    },
    [input, conversationId, chatMutation, screenCtx]
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const isLoading = chatMutation.isPending || screenshotPending;
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
      {chatMutation.isError && (
        <div className="mx-3 mb-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          Erro ao enviar mensagem. Tente novamente.
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
