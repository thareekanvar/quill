"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useAuthStore } from "@/lib/stores/auth-store";
import { AppSidebar } from "@/components/blocks/dashboard/components/app-sidebar";
import { SiteHeader } from "@/components/blocks/dashboard/components/site-header";
import { SettingsBanner } from "@/components/dashboard/settings-banner";
import { useTranslation } from "@/contexts/translation-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, connectionId, password, _hasHydrated, logout } =
    useAuthStore();
  const { t } = useTranslation();
  const router = useRouter();

  // If not authenticated after hydration, logout and redirect
  useEffect(() => {
    if (_hasHydrated && (!isAuthenticated || !connectionId || !password)) {
      logout().then(() => {
        router.push('/login');
      });
    }
  }, [_hasHydrated, isAuthenticated, connectionId, password, logout, router]);

  // Show loading state while hydrating
  if (!_hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-muted-foreground">
            {t.common.loading}
          </p>
        </div>
      </div>
    );
  }

  // If not authenticated, show loading while redirecting
  if (!isAuthenticated || !connectionId || !password) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-muted-foreground">
            {t.common.loading}
          </p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <SettingsBanner />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2 p-4">
              {children}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </QueryClientProvider>
  );
}
