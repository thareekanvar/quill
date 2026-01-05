"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useAuthStore } from "@/lib/stores/auth-store";
import { AppSidebar } from "@/components/blocks/dashboard/components/app-sidebar";
import { SiteHeader } from "@/components/blocks/dashboard/components/site-header";
import { SettingsBanner } from "@/components/dashboard/settings-banner";
import { getConnection } from "@/lib/db";
import { useTranslation } from "@/contexts/translation-context";

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
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(true);
  const isRedirectingRef = useRef(false);
  const { t } = useTranslation();

  useEffect(() => {
    // Wait for store hydration before checking auth
    if (!_hasHydrated) {
      return;
    }

    // Prevent multiple validation runs if already redirecting
    if (isRedirectingRef.current) {
      return;
    }

    let isCancelled = false;

    const validateSession = async () => {
      // If not authenticated, redirect immediately
      if (!isAuthenticated || !connectionId || !password) {
        if (!isRedirectingRef.current && !isCancelled) {
          isRedirectingRef.current = true;
          router.push("/login");
        }
        return;
      }

      // Validate that the stored connection still exists and password is correct
      try {
        const connection = await getConnection(connectionId, password);
        if (isCancelled) return;
        
        if (!connection) {
          // Connection not found, logout and redirect
          if (!isRedirectingRef.current) {
            isRedirectingRef.current = true;
            await logout();
            router.push("/login");
          }
          return;
        }
        setIsValidating(false);
      } catch (error) {
        // Connection invalid or password wrong, logout and redirect
        if (isCancelled) return;
        console.error("Connection validation failed:", error);
        if (!isRedirectingRef.current) {
          isRedirectingRef.current = true;
          await logout();
          router.push("/login");
        }
      }
    };

    validateSession();

    // Cleanup function to prevent state updates if component unmounts
    return () => {
      isCancelled = true;
    };
  }, [_hasHydrated, isAuthenticated, connectionId, password]);

  // Show loading state while hydrating or validating
  if (!_hasHydrated || isValidating || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-muted-foreground">{t.common.loading}</p>
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
