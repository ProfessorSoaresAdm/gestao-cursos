import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthGuard } from '@/auth/AuthGuard';
import { AuthProvider } from '@/auth/AuthContext';
import LoginPage from '@/auth/LoginPage';
import { Layout } from '@/components/layout/Layout';
import { Loader2 } from 'lucide-react';

const DashboardPage = lazy(() => import('@/modules/dashboard/DashboardPage'));
const AulasPage = lazy(() => import('@/modules/aulas/AulasPage'));
const PagamentosPage = lazy(() => import('@/modules/pagamentos/PagamentosPage'));
const ProfessoresPage = lazy(() => import('@/modules/professores/ProfessoresPage'));
const PessoalPage = lazy(() => import('@/modules/pessoal/PessoalPage'));
const UsuariosPage = lazy(() => import('@/modules/usuarios/UsuariosPage'));
const BackupPage = lazy(() => import('@/modules/backup/BackupPage'));
import { Toaster } from '@/components/ui/sonner';

// CRÍTICO: estas configurações evitam instabilidade ao trocar de aba (da skill auth-login-stability)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: false,
    },
  },
});

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh] w-full">
    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
  </div>
);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              {/* Rotas Privadas encapsuladas pelo Layout */}
              <Route
                path="/"
                element={
                  <AuthGuard>
                    <Layout />
                  </AuthGuard>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="aulas" element={<AulasPage />} />
                <Route path="pagamentos" element={<PagamentosPage />} />
                <Route path="professores" element={<ProfessoresPage />} />
                <Route path="pessoal" element={<PessoalPage />} />
                <Route path="usuarios" element={<UsuariosPage />} />
                <Route path="backup" element={<BackupPage />} />
              </Route>

              {/* Catch-all route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
          <Toaster theme="dark" position="top-right" richColors />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
