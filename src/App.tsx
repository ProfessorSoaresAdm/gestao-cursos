import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthGuard } from '@/auth/AuthGuard';
import LoginPage from '@/auth/LoginPage';
import { Layout } from '@/components/layout/Layout';

// Pages
import AulasPage from '@/modules/aulas/AulasPage';
import PagamentosPage from '@/modules/pagamentos/PagamentosPage';
import ProfessoresPage from '@/modules/professores/ProfessoresPage';
import PessoalPage from '@/modules/pessoal/PessoalPage';

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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
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
            <Route index element={<Navigate to="/aulas" replace />} />
            <Route path="aulas" element={<AulasPage />} />
            <Route path="pagamentos" element={<PagamentosPage />} />
            <Route path="professores" element={<ProfessoresPage />} />
            <Route 
              path="pessoal" 
              element={
                <AuthGuard requireAdmin={true}>
                  <PessoalPage />
                </AuthGuard>
              } 
            />
          </Route>

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/aulas" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
