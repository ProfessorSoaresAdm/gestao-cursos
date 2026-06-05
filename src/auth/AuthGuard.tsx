import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const { user, role, telasAcesso, ativo, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (!ativo) {
    return <Navigate to="/login?error=suspended" replace />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isAdmin = role === 'admin';

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (!isAdmin && location.pathname !== '/') {
    // Extrai o nome da tela da rota (ex: "/professores" -> "professores")
    const currentScreen = location.pathname.split('/')[1];
    
    // Lista de rotas válidas que requerem verificação no array de permissões
    const restrictedScreens = ['dashboard', 'aulas', 'pagamentos', 'professores', 'pessoal', 'usuarios', 'backup'];
    
    if (restrictedScreens.includes(currentScreen) && !telasAcesso.includes(currentScreen)) {
      if (telasAcesso.length > 0) {
        return <Navigate to={`/${telasAcesso[0]}`} replace />;
      }
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6">
          <h1 className="text-2xl font-bold text-red-500 mb-2">Acesso Restrito</h1>
          <p className="text-slate-400 mb-6 text-center">
            Seu perfil não possui acesso a esta tela, e você não possui nenhuma outra tela liberada.<br/>
            Contate o administrador ou faça login novamente se houver um erro de conexão.
          </p>
          <button 
            onClick={() => signOut()} 
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
          >
            Sair e Voltar ao Login
          </button>
        </div>
      );
    }
  }

  return <>{children}</>;
}
