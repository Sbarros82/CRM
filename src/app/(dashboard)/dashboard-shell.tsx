"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { MobileRouteGuard } from "@/components/layout/mobile-route-guard";
import { PresenceHeartbeat } from "@/components/presence/presence-heartbeat";
import { HandoffScreenPush } from "@/components/inbox/handoff-screen-push";
import { ChatScreenPush } from "@/components/chat/chat-screen-push";
import { PwaRegister } from "@/components/pwa-register";

function DashboardShellInner({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Sidebar drawer — unused on phone (bottom nav). Kept for tablet/desktop.
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <PresenceHeartbeat />
      <HandoffScreenPush />
      <ChatScreenPush />
      <PwaRegister />
      <Suspense fallback={null}>
        <MobileRouteGuard />
      </Suspense>
      {/* Full sidebar only from lg — phone uses bottom nav. */}
      <div className="hidden lg:contents">
        <Sidebar open={sidebarOpen} onClose={closeSidebar} />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onOpenSidebar={() => setSidebarOpen(true)} mobileCompanion />
        <main className="min-h-0 flex-1 overflow-y-auto p-4 pb-20 sm:p-6 lg:pb-6">
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardShellInner>{children}</DashboardShellInner>
    </AuthProvider>
  );
}
