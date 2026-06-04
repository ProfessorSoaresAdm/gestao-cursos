import React, { useState } from 'react';
import { AulasPanel } from '../components/AulasPanel';
import { ProfessoresPanel } from '../components/ProfessoresPanel';
import { PagamentosPanel } from '../components/PagamentosPanel';
import { PessoalPanel } from '../components/PessoalPanel';
import { UsuariosPanel } from '../components/UsuariosPanel';
import { useAuth } from '../auth/useAuth';
import { 
  BookOpen, 
  Users, 
  DollarSign, 
  Briefcase, 
  Settings, 
  LogOut, 
  Lock, 
  GraduationCap 
} from 'lucide-react';

export default function Dashboard() {
  const { user, role, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'aulas' | 'professores' | 'pagamentos' | 'pessoal' | 'usuarios'>('aulas');

  const isAdmin = role === 'admin';
  const isEditor = role === 'editor';

  const handleLogout = async () => {
    if (window.confirm('Tem certeza que deseja fechar sua sessão?')) {
      await signOut();
    }
  };

  // Se por algum motivo renderizar sem usuário (não deveria por causa do AuthGuard)
  if (!user) return null;

  const userName = user.user_metadata?.nome || user.email?.split('@')[0] || 'Usuário';

  return (
    <div className="min-h-screen flex flex-col md:flex-row text-slate-100 bg-slate-900">
      
      {/* Sidebar Layout */}
      <aside className="w-full md:w-64 bg-slate-800 border-r border-slate-700 shrink-0 flex flex-col">
        
        {/* Brand/Header logotype */}
        <div className="p-5 border-b border-slate-700 flex items-center space-x-3 bg-slate-900/50">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500/30 to-indigo-500/5 border border-indigo-500/20 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg backdrop-blur-md">
            GE
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-wide uppercase text-white">Gestão Escolar</h1>
            <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">Unificado de Ensino</p>
          </div>
        </div>

        {/* Profiles Details widget */}
        <div className="p-4 border-b border-slate-700 bg-slate-800">
          <div className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">Usuário Conectado</div>
          <div className="font-bold text-white mt-1 truncate text-sm" title={userName}>
            {userName}
          </div>
          <div className="text-[11px] text-slate-400 truncate mt-0.5">{user.email}</div>
          
          <div className="mt-2.5">
            {role === 'admin' && (
              <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded">
                👑 Administrador
              </span>
            )}
            {role === 'editor' && (
              <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                ✏️ Coordenador
              </span>
            )}
            {role === 'viewer' && (
              <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                👁️ Secretário
              </span>
            )}
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <button
            onClick={() => setActiveTab('aulas')}
            className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold transition-all focus:outline-none ${
              activeTab === 'aulas'
                ? 'bg-indigo-500/20 text-white shadow-md border-l-4 border-indigo-500'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <BookOpen className="w-4 h-4 mr-3 shrink-0" />
            Aulas ao Vivo
          </button>

          <button
            onClick={() => setActiveTab('professores')}
            className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold transition-all focus:outline-none ${
              activeTab === 'professores'
                ? 'bg-indigo-500/20 text-white shadow-md border-l-4 border-indigo-500'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <GraduationCap className="w-4 h-4 mr-3 shrink-0" />
            Professores
          </button>

          <button
            onClick={() => setActiveTab('pagamentos')}
            className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold transition-all focus:outline-none ${
              activeTab === 'pagamentos'
                ? 'bg-indigo-500/20 text-white shadow-md border-l-4 border-indigo-500'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <DollarSign className="w-4 h-4 mr-3 shrink-0" />
            Caixa & Pagamentos
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('pessoal')}
              className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold transition-all focus:outline-none ${
                activeTab === 'pessoal'
                  ? 'bg-indigo-500/20 text-white shadow-md border-l-4 border-indigo-500'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Briefcase className="w-4 h-4 mr-3 shrink-0" />
              Pessoal (Admin)
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setActiveTab('usuarios')}
              className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold transition-all focus:outline-none ${
                activeTab === 'usuarios'
                  ? 'bg-indigo-500/20 text-white shadow-md border-l-4 border-indigo-500'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Settings className="w-4 h-4 mr-3 shrink-0" />
              Acessos de Usuários
            </button>
          )}
        </nav>

        {/* Logout bottom attachment */}
        <div className="p-3 border-t border-slate-700 bg-slate-900/50 flex flex-col space-y-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors focus:outline-none"
          >
            <LogOut className="w-4 h-4 mr-3 shrink-0" />
            Encerrar Sessão
          </button>
          <div className="text-center text-[10px] text-slate-500 pt-2 border-t border-slate-800">
            Desenvolvido por <a href="https://wa.me/5512982176890" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium">AndreSD</a>
          </div>
        </div>
      </aside>

      {/* Main Panel Side */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-900">
        
        {/* Sub Header bar */}
        <header className="h-18 py-4 px-6 md:px-8 flex items-center justify-between shrink-0 shadow-lg border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm z-10 sticky top-0">
          <div className="flex items-center space-x-2">
            <h2 className="font-extrabold text-white text-lg md:text-xl tracking-tight">
              {activeTab === 'aulas' && 'Aulas ao Vivo'}
              {activeTab === 'professores' && 'Cadastro de Professores'}
              {activeTab === 'pagamentos' && 'Caixa & Pagamentos'}
              {activeTab === 'pessoal' && 'Ficha de Pessoal & Salários'}
              {activeTab === 'usuarios' && 'Controle de Acessos Acadêmicos'}
            </h2>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              {activeTab === 'aulas' && 'Aulas agendadas e links de gravação.'}
              {activeTab === 'professores' && 'Encontre, crie ou altere status de docentes.'}
              {activeTab === 'pagamentos' && 'Histórico financeiro, atrasados e quitações rápidas.'}
              {activeTab === 'pessoal' && 'Visualização de salários e equipe operacional.'}
              {activeTab === 'usuarios' && 'Permissões específicas de cargos.'}
            </span>
          </div>

          <div className="text-xs text-indigo-400 font-mono font-semibold hidden lg:block bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-full">
            Sessão Segura
          </div>
        </header>

        {/* Content Box */}
        <div className="p-6 md:p-8 max-w-7xl w-full mx-auto">
          {/* Mocking the user role for the internal panels for now, since they expect a specific shape in the old code. We pass the role from Supabase. */}
          {activeTab === 'aulas' && <AulasPanel userRole={role || 'viewer'} />}
          {activeTab === 'professores' && <ProfessoresPanel userRole={role || 'viewer'} />}
          {activeTab === 'pagamentos' && <PagamentosPanel userRole={role || 'viewer'} />}
          
          {activeTab === 'pessoal' && isAdmin && (
            <PessoalPanel userRole={role || 'viewer'} />
          )}

          {activeTab === 'usuarios' && isAdmin && (
            <UsuariosPanel currentUser={{ id: user.id, name: userName, email: user.email!, role: role || 'viewer', status: 'active' } as any} />
          )}
        </div>
      </main>
    </div>
  );
}
