import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { ExpirationBanner } from "@/components/shared/ExpirationBanner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export function AppShell() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden lg:block">
        <Sidebar />
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <ExpirationBanner />
        <Header onOpenMobileNav={() => setMobileNavOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 pb-6 pt-4 sm:p-5 sm:pb-8 lg:p-6">
          <Outlet />
        </main>
      </div>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-[84vw] max-w-[320px] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Menu de navegacao</SheetTitle>
          </SheetHeader>
          <Sidebar compact onNavigate={() => setMobileNavOpen(false)} className="w-full" />
        </SheetContent>
      </Sheet>
    </div>
  );
}
