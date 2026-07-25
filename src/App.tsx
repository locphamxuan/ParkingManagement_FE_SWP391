import { useEffect } from 'react';
import { AppRouter } from '@/routes/AppRouter';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useAuthStore } from '@/store/authStore';

export default function App() {
  // Restore session on load via the httpOnly auth cookie (GET /users/auth/me).
  useEffect(() => {
    void useAuthStore.getState().bootstrap();
  }, []);

  return (
    <ErrorBoundary>
      <AppRouter />
    </ErrorBoundary>
  );
}
