/**
 * Authentication-related type definitions
 */

export interface AuthState {
  isAuthenticated: boolean;
  connectionId: string | null;
  password: string | null;
  isValidating: boolean;
  error: string | null;
  _hasHydrated: boolean;
  login: (connectionId: string, password: string) => void;
  logout: () => Promise<void>;
  setValidating: (isValidating: boolean) => void;
  setError: (error: string | null) => void;
  setPassword: (password: string) => void;
  setHasHydrated: (state: boolean) => void;
}

