import { useEffect, useRef } from "react";
import { Bot, User } from "lucide-react";
import { ArkyActionCard } from "./ArkyActionCard";
import type { ArkyMessage } from "./arky.types";

interface ArkyMessageListProps {
  messages: ArkyMessage[];
  isLoading: boolean;
  onActionConfirmed?: (previewId: string) => void;
  onActionRejected?: (previewId: string) => void;
}

export function ArkyMessageList({
  messages,
  isLoading,
  onActionConfirmed,
  onActionRejected,
}: ArkyMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Bot className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Olá! Sou o Arky</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Como posso ajudar você com o Engify?
          </p>
        </div>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {QUICK_PROMPTS.map((prompt) => (
            <span
              key={prompt}
              className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
            >
              {prompt}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          onActionConfirmed={onActionConfirmed}
          onActionRejected={onActionRejected}
        />
      ))}

      {isLoading && <ThinkingIndicator />}

      <div ref={bottomRef} />
    </div>
  );
}

function MessageBubble({
  message,
  onActionConfirmed,
  onActionRejected,
}: {
  message: ArkyMessage;
  onActionConfirmed?: (id: string) => void;
  onActionRejected?: (id: string) => void;
}) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        }`}
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>

      <div className={`max-w-[85%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        <div
          className={`rounded-2xl px-3 py-2 text-sm ${
            isUser
              ? "rounded-tr-sm bg-primary text-primary-foreground"
              : "rounded-tl-sm bg-muted text-foreground"
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>

        {/* Action cards for assistant messages */}
        {!isUser && message.cards && message.cards.length > 0 && (
          <div className="mt-1 w-full">
            {message.cards.map((card, i) => (
              <ArkyActionCard
                key={card.action_preview_id ?? i}
                card={card}
                actions={message.actions ?? []}
                onConfirmed={onActionConfirmed}
                onRejected={onActionRejected}
              />
            ))}
          </div>
        )}

        <span className="mt-1 text-[10px] text-muted-foreground">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex gap-2">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
        <Bot className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-muted px-3 py-2">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
      </div>
    </div>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

const QUICK_PROMPTS = [
  "Quais obras estão em andamento?",
  "Me explique essa tela",
  "Quais pendências existem?",
];
