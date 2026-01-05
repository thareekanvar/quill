import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthState } from '@/types/auth';
import { clearAllConnections } from '@/lib/db';

const PASSWORD_KEY = 'postadmin-password';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      // Load password from sessionStorage on init
      let initialPassword: string | null = null;
      if (typeof window !== 'undefined') {
        try {
          initialPassword = sessionStorage.getItem(PASSWORD_KEY);
        } catch {
          // Ignore
        }
      }

      return {
        isAuthenticated: false,
        connectionId: null,
        password: initialPassword,
        isValidating: false,
        error: null,
        _hasHydrated: false,
        login: (connectionId: string, password: string) => {
          if (typeof window !== 'undefined') {
            try {
              sessionStorage.setItem(PASSWORD_KEY, password);
              // Set cookie for middleware
              document.cookie = `postadmin-auth=true; path=/; max-age=86400; SameSite=Lax`;
            } catch {
              // Ignore
            }
          }
          set({
            isAuthenticated: true,
            connectionId,
            password,
            error: null,
          });
        },
        logout: async () => {
          if (typeof window !== 'undefined') {
            try {
              sessionStorage.removeItem(PASSWORD_KEY);
              // Remove cookie for proxy
              document.cookie = `postadmin-auth=; path=/; max-age=0; SameSite=Lax`;
            } catch {
              // Ignore
            }
          }
          
          // Clear all connections, cards, and charts from IndexedDB
          try {
            await clearAllConnections();
          } catch (error) {
            console.error('Failed to clear connections on logout:', error);
            // Continue with logout even if clearing fails
          }
          
          set({
            isAuthenticated: false,
            connectionId: null,
            password: null,
            error: null,
          });
        },
        setValidating: (isValidating: boolean) => set({ isValidating }),
        setError: (error: string | null) => set({ error }),
        setPassword: (password: string) => {
          if (typeof window !== 'undefined') {
            try {
              sessionStorage.setItem(PASSWORD_KEY, password);
            } catch {
              // Ignore
            }
          }
          set({ password });
        },
        setHasHydrated: (state: boolean) => {
          set({ _hasHydrated: state });
        },
      };
    },
    {
      name: 'postadmin-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        connectionId: state.connectionId,
        // Never persist password in localStorage - use sessionStorage instead
      }),
      onRehydrateStorage: () => (state) => {
        // Restore password from sessionStorage after hydration
        if (state && typeof window !== 'undefined') {
          try {
            const storedPassword = sessionStorage.getItem(PASSWORD_KEY);
            if (storedPassword && state.connectionId) {
              state.password = storedPassword;
            }
            // Sync cookie with auth state after hydration
            if (state.isAuthenticated && state.connectionId) {
              document.cookie = `postadmin-auth=true; path=/; max-age=86400; SameSite=Lax`;
            } else {
              document.cookie = `postadmin-auth=; path=/; max-age=0; SameSite=Lax`;
            }
          } catch {
            // Ignore
          }
        }
        state?.setHasHydrated(true);
      },
    }
  )
);

