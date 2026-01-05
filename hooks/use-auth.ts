import { useAuthStore } from '@/lib/stores/auth-store';
import { storeConnection, getConnection } from '@/lib/db';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const router = useRouter();
  const { isAuthenticated, connectionId, password, login, logout, setValidating, setError } = useAuthStore();

  const handleLogin = async (url: string, password: string, name?: string) => {
    try {
      setValidating(true);
      setError(null);

      // First, validate the connection
      const response = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ connectionString: url }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Invalid connection');
      }

      // Store the connection with optional name
      const connId = await storeConnection(url, password, name);

      // Login
      login(connId, password);

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error: any) {
      setError(error.message || 'Login failed');
      throw error;
    } finally {
      setValidating(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return {
    isAuthenticated,
    connectionId,
    password,
    login: handleLogin,
    logout: handleLogout,
  };
}

