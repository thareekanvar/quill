"use client";

import { LoginForm } from "@/components/auth/login-form";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useTranslation } from "@/contexts/translation-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function LoginPageClient() {
  const { t } = useTranslation();
  const { isAuthenticated, connectionId, password, _hasHydrated, logout } = useAuthStore();
  const router = useRouter();

  // If authenticated but missing password or connectionId, logout
  useEffect(() => {
    if (_hasHydrated && isAuthenticated && (!connectionId || !password)) {
      logout();
    }
  }, [_hasHydrated, isAuthenticated, connectionId, password, logout]);

  // Show loading state while checking auth
  if (!_hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-muted-foreground">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  // If fully authenticated, redirect to dashboard (proxy will handle this, but show loading)
  if (isAuthenticated && connectionId && password) {
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
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
}

