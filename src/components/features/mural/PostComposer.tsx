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
  mobileDocked?: boolean;
}

export function PostComposer({ onPublish, isPublishing, className, mobileDocked = false }: PostComposerProps) {
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
    const nextHeight = Math.min(textarea.scrollHeight, mobileDocked ? 220 : 320);
    textarea.style.height = `${nextHeight}px`;
  }, [content, mobileDocked]);

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
    if (!mobileDocked) return;

    window.setTimeout(() => {
      textareaRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, 250);
  };

  return (
    <div
      className={cn(
        "relative rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-all focus-within:border-primary/30 focus-within:ring-4 focus-within:ring-primary/5",
        mobileDocked && "rounded-[20px] px-3 pb-3 pt-3",
        className
      )}
    >
      <Textarea
        ref={textareaRef}
        placeholder="O que está acontecendo na obra? Use @ para mencionar alguém..."
        value={content}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        onFocus={handleTextareaFocus}
        maxLength={2000}
        className={cn(
          "w-full resize-none overflow-y-auto border-none bg-transparent p-0 text-sm focus-visible:ring-0 placeholder:text-muted-foreground/50",
          mobileDocked
            ? "min-h-[96px] max-h-[220px] text-[15px] leading-6"
            : "min-h-[100px] max-h-[320px]"
        )}
      />
      {content.length > 1800 && (
        <p className={`text-right text-[10px] font-medium ${content.length >= 2000 ? "text-destructive" : "text-muted-foreground/60"}`}>
          {content.length}/2000
        </p>
      )}

      {/* Files Preview */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2 py-3"
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

      <div
        className={cn(
          "flex flex-col gap-2 border-t border-border/40 pt-3 sm:flex-row sm:items-center sm:justify-between",
          mobileDocked && "gap-3"
        )}
      >
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={handleFileAdd}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="h-10 gap-2 rounded-xl text-muted-foreground transition-all hover:bg-primary/5 hover:text-primary sm:h-9"
          >
            <Paperclip className="h-4 w-4" />
            <span className="text-xs font-semibold">Anexar</span>
          </Button>

          {files.length > 0 && !hasMessage && (
            <span className="text-[11px] font-medium text-amber-600">
              Escreva uma mensagem para enviar anexos.
            </span>
          )}
        </div>

        <Button
          size="sm"
          onClick={handlePublishClick}
          disabled={!canPublish}
          className={cn(
            "h-10 w-full gap-2 rounded-xl bg-primary px-5 shadow-sm transition-all active:scale-95 hover:bg-primary/90 sm:h-9 sm:w-auto",
            mobileDocked && "sticky bottom-0"
          )}
        >
          {isPublishing ? (
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-background border-t-transparent" />
              Publicando...
            </span>
          ) : (
            <>
              <Send className="h-3.5 w-3.5" />
              <span className="font-semibold">Publicar</span>
            </>
          )}
        </Button>
      </div>

      {/* Mentions Dropdown */}
      <AnimatePresence>
        {mentionSearch !== null && filteredUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className="absolute z-50 mt-1 max-h-60 w-64 overflow-y-auto rounded-xl border border-border/60 bg-popover p-1 shadow-xl backdrop-blur-sm"
            style={{ bottom: "100%", left: 16 }}
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
