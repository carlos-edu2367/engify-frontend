import { useState } from "react";
import { Bot, X } from "lucide-react";
import { ArkyPanel } from "./ArkyPanel";

/**
 * ArkyWidget — floating copilot button + side panel.
 * Rendered inside AppShell so it's available on all authenticated pages.
 */
export function ArkyWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating trigger button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg ring-2 ring-primary/20 transition-transform hover:scale-105 active:scale-95"
          aria-label="Abrir Arky Copilot"
        >
          <Bot className="h-6 w-6 text-primary-foreground" />
        </button>
      )}

      {/* Side panel overlay */}
      {isOpen && (
        <>
          {/* Backdrop on mobile */}
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div
            className="fixed bottom-0 right-0 z-50 flex h-[100dvh] w-full flex-col shadow-2xl sm:h-[600px] sm:w-[400px] sm:bottom-6 sm:right-6 sm:rounded-2xl overflow-hidden border border-border"
            role="dialog"
            aria-label="Arky Copilot"
          >
            <ArkyPanel onClose={() => setIsOpen(false)} />
          </div>
        </>
      )}
    </>
  );
}
