import { useEffect, useState } from "react";
import { Bot, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/store/auth.store";
import {
  hasSeenArkyOnboarding,
  markArkyOnboardingSeen,
} from "./arky-onboarding";
import { ArkyPanel } from "./ArkyPanel";

/**
 * ArkyWidget — floating copilot button + side panel.
 * Rendered inside AppShell so it's available on all authenticated pages.
 */
export function ArkyWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [introOpen, setIntroOpen] = useState(false);
  const userId = useAuthStore((state) => state.user?.id);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!hasSeenArkyOnboarding(window.localStorage, userId)) {
      setIntroOpen(true);
    }
  }, [userId]);

  const dismissIntro = () => {
    if (typeof window !== "undefined") {
      markArkyOnboardingSeen(window.localStorage, userId);
    }

    setIntroOpen(false);
  };

  const openArkyFromIntro = () => {
    dismissIntro();
    setIsOpen(true);
  };

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

      <Dialog
        open={introOpen}
        onOpenChange={(open) => {
          if (!open) {
            dismissIntro();
            return;
          }

          setIntroOpen(true);
        }}
      >
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md">
          <DialogHeader className="gap-3 text-left">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="space-y-2">
              <DialogTitle>Agora o Arky também está no Engify</DialogTitle>
              <DialogDescription className="leading-6">
                Ele pode te auxiliar nas telas complexas, explicar dados do sistema
                e orientar fluxos de obras, financeiro e RH com o contexto da página
                atual.
              </DialogDescription>
            </div>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={dismissIntro}>
              Agora não
            </Button>
            <Button onClick={openArkyFromIntro}>
              <Bot className="h-4 w-4" aria-hidden="true" />
              Abrir Arky
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
