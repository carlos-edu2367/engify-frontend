import { useEffect, useRef, useState } from "react";
import { Paperclip, Send, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUsers } from "@/hooks/useMembros";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface PostComposerProps {
  onPublish: (content: string, mentions: string[], files: File[]) => Promise<void>;
  isPublishing: boolean;
  className?: string;
}

export function PostComposer({ onPublish, isPublishing, className }: PostComposerProps) {
  const { data: users = [] } = useUsers();
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [mentionSearch, setMentionSearch] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(-1);
  const [cursorPos, setCursorPos] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasMessage = content.trim().length > 0;
  const canPublish = hasMessage && !isPublishing;

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "0px";
    const nextHeight = Math.min(textarea.scrollHeight, 320);
    textarea.style.height = `${nextHeight}px`;
  }, [content]);

  const filteredUsers = mentionSearch
    ? users.filter((u) =>
        u.nome.toLowerCase().includes(mentionSearch.toLowerCase())
      )
    : [];

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const pos = e.target.selectionStart;
    setContent(value);
    setCursorPos(pos);

    // Check for mention trigger
    const lastAt = value.lastIndexOf("@", pos - 1);
    const textAfterAt = value.slice(lastAt + 1, pos);
    
    if (lastAt !== -1 && !textAfterAt.includes(" ") && lastAt < pos) {
      setMentionSearch(textAfterAt);
      setMentionIndex(0);
    } else {
      setMentionSearch(null);
    }
  };

  const insertMention = (user: { user_id: string; nome: string }) => {
    if (!textareaRef.current) return;

    const lastAt = content.lastIndexOf("@", cursorPos - 1);
    const before = content.slice(0, lastAt);
    const after = content.slice(cursorPos);

    // Usa underscore para nomes compostos: @João_Silva → exibido como @João Silva
    const slug = user.nome.replace(/\s+/g, "_");
    const newContent = `${before}@${slug} ${after}`;
    setContent(newContent);
    setMentionSearch(null);

    // Refocus and place cursor after mention
    setTimeout(() => {
      textareaRef.current?.focus();
      const newPos = lastAt + slug.length + 2;
      textareaRef.current?.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (mentionSearch !== null && filteredUsers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((prev) => (prev + 1) % filteredUsers.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(filteredUsers[mentionIndex]);
      } else if (e.key === "Escape") {
        setMentionSearch(null);
      }
    }
  };

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...newFiles].slice(0, 5));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePublishClick = async () => {
    if (!hasMessage) return;
    
    // Extrai IDs das menções buscando pelo slug @Nome_Sobrenome no conteúdo
    const mentions = users
      .filter((u) => content.includes(`@${u.nome.replace(/\s+/g, "_")}`))
      .map((u) => u.user_id);

    await onPublish(content, mentions, files);
    setContent("");
    setFiles([]);
  };

  const handleTextareaFocus = () => {
    window.setTimeout(() => {
      textareaRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 250);
  };

  return (
    <div
      className={cn(
        "relative overflow-visible rounded-[28px] border border-border/60 bg-card/95 p-4 shadow-sm transition-all focus-within:border-primary/30 focus-within:ring-4 focus-within:ring-primary/5 sm:p-5",
        className
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">Nova mensagem</p>
          <p className="text-xs text-muted-foreground">
            Use <span className="font-semibold text-foreground/80">@</span> para mencionar pessoas e anexe imagens ou PDFs.
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Mural
        </span>
      </div>

      <div className="rounded-[22px] border border-border/50 bg-background/80 px-4 py-3 shadow-inner">
        <Textarea
          ref={textareaRef}
          placeholder="O que está acontecendo na obra? Use @ para mencionar alguém..."
          value={content}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onFocus={handleTextareaFocus}
          maxLength={2000}
          className="min-h-[112px] max-h-[320px] w-full resize-none overflow-y-auto border-none bg-transparent p-0 text-[15px] leading-6 focus-visible:ring-0 placeholder:text-muted-foreground/50 sm:min-h-[128px]"
        />
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-border/40 pt-3">
          <div className="flex min-w-0 items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={handleFileAdd}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-10 gap-2 rounded-xl px-3 text-muted-foreground transition-all hover:bg-primary/5 hover:text-primary"
            >
              <Paperclip className="h-4 w-4" />
              <span className="text-xs font-semibold">Anexar</span>
            </Button>

            <span className="truncate text-[11px] font-medium text-muted-foreground/80">
              {files.length > 0
                ? `${files.length} anexo${files.length > 1 ? "s" : ""} pronto${files.length > 1 ? "s" : ""}`
                : "Mensagem de ate 2000 caracteres"}
            </span>
          </div>

          <span
            className={cn(
              "shrink-0 text-[11px] font-medium",
              content.length >= 2000 ? "text-destructive" : "text-muted-foreground/60"
            )}
          >
            {content.length}/2000
          </span>
        </div>
      </div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2 py-4"
          >
            {files.map((file, i) => (
              <motion.div
                key={i}
                layout
                className="group relative flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2 text-xs border border-border/40"
              >
                <Paperclip className="h-3 w-3 text-muted-foreground" />
                <span className="max-w-[120px] truncate font-medium text-foreground/70">
                  {file.name}
                </span>
                <button
                  onClick={() => removeFile(i)}
                  className="rounded-full p-0.5 hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground/60"
                >
                  <X className="h-3 w-3" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-3 border-t border-border/40 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          {files.length > 0 && !hasMessage ? (
            <span className="block text-[11px] font-medium text-amber-600">
              Escreva uma mensagem para enviar anexos.
            </span>
          ) : (
            <span className="block text-[11px] font-medium text-muted-foreground/80">
              {hasMessage ? "Mensagem pronta para envio" : "Digite a atualização que deseja compartilhar"}
            </span>
          )}
          <p className="text-xs text-muted-foreground/70">
            Menções e anexos serão mantidos ao publicar.
          </p>
        </div>

        <Button
          type="button"
          onClick={handlePublishClick}
          disabled={!canPublish}
          className="h-12 w-full gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold shadow-sm transition-all active:scale-[0.99] hover:bg-primary/90 sm:w-auto sm:min-w-[148px]"
        >
          {isPublishing ? (
            <span className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-background border-t-transparent" />
              Enviando...
            </span>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>Enviar mensagem</span>
            </>
          )}
        </Button>
      </div>

      <AnimatePresence>
        {mentionSearch !== null && filteredUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className="absolute inset-x-4 top-[4.75rem] z-50 max-h-60 overflow-y-auto rounded-2xl border border-border/60 bg-popover p-1 shadow-xl backdrop-blur-sm sm:left-5 sm:right-auto sm:w-72"
          >
            {filteredUsers.map((user, i) => (
              <button
                key={user.user_id}
                onClick={() => insertMention(user)}
                onMouseEnter={() => setMentionIndex(i)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                  i === mentionIndex
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted"
                }`}
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                  <User className="h-3.5 w-3.5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold truncate">{user.nome}</span>
                  <span className="text-[10px] text-muted-foreground truncate uppercase tracking-tighter">{user.role}</span>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
