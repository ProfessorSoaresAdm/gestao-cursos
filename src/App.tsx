/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserService } from './services/UserService';
import { User, initializeDB } from './services/db';
import { LoginScreen } from './components/LoginScreen';
import { AulasPanel } from './components/AulasPanel';
import { ProfessoresPanel } from './components/ProfessoresPanel';
import { PagamentosPanel } from './components/PagamentosPanel';
import { PessoalPanel } from './components/PessoalPanel';
import { UsuariosPanel } from './components/UsuariosPanel';
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

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'aulas' | 'professores' | 'pagamentos' | 'pessoal' | 'usuarios'>('aulas');

  // Load database seeds and read active session on startup
  useEffect(() => {
    initializeDB();
    const currentSessionUser = UserService.getCurrentUser();
    if (currentSessionUser) {
      setUser(currentSessionUser);
    }
  }, []);

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    // After login, default to the classes (Aulas) module according to RF-01.5
    setActiveTab('aulas');
  };

  const handleLogout = () => {
    if (window.confirm('Tem certeza que deseja fechar sua sessão?')) {
      UserService.logout();
      setUser(null);
    }
  };

  if (!user) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  const isAdmin = user.role === 'admin';

  return (
    <div className="min-h-screen flex flex-col md:flex-row text-slate-100">
      
      {/* Sidebar Layout */}
      <aside className="w-full md:w-64 glass-sidebar shrink-0 flex flex-col">
        
        {/* Brand/Header logotype */}
        <div className="p-5 border-b border-white/10 flex items-center space-x-3 bg-black/25">
          <div className="w-10 h-10 bg-gradient-to-br from-white/30 to-white/5 border border-white/20 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg backdrop-blur-md">
            GE
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-wide uppercase text-white">Gestão Escolar</h1>
            <p className="text-[10px] text-indigo-300 font-semibold uppercase tracking-wider">Unificado de Ensino</p>
          </div>
        </div>

        {/* Profiles Details widget */}
        <div className="p-4 border-b border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="text-xs text-indigo-200 font-semibold uppercase tracking-wider">Usuário Conectado</div>
          <div className="font-bold text-white mt-1 truncate text-sm" title={user.name}>
            {user.name}
          </div>
          <div className="text-[11px] text-indigo-200/50 truncate mt-0.5">{user.email}</div>
          
          <div className="mt-2.5">
            {user.role === 'admin' && (
              <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest glass-badge-red">
                👑 Administrador
              </span>
            )}
            {user.role === 'editor' && (
              <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest glass-badge-amber">
                ✏️ Coordenador
              </span>
            )}
            {user.role === 'viewer' && (
              <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest glass-badge-blue">
                👁️ Secretário
              </span>
            )}
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 p-3 space-y-1 bg-black/10">
          {/* Aulas/Classes Option */}
          <button
            id="tab-aulas"
            onClick={() => setActiveTab('aulas')}
            className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold transition-all focus:outline-none ${
              activeTab === 'aulas'
                ? 'bg-white/15 text-white shadow-md border-l-4 border-indigo-400'
                : 'text-indigo-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <BookOpen className="w-4 h-4 mr-3 shrink-0" />
            Aulas ao Vivo
          </button>

          {/* Professores Option */}
          <button
            id="tab-professores"
            onClick={() => setActiveTab('professores')}
            className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold transition-all focus:outline-none ${
              activeTab === 'professores'
                ? 'bg-white/15 text-white shadow-md border-l-4 border-indigo-400'
                : 'text-indigo-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <GraduationCap className="w-4 h-4 mr-3 shrink-0" />
            Professores
          </button>

          {/* Pagamentos Option */}
          <button
            id="tab-pagamentos"
            onClick={() => setActiveTab('pagamentos')}
            className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold transition-all focus:outline-none ${
              activeTab === 'pagamentos'
                ? 'bg-white/15 text-white shadow-md border-l-4 border-indigo-400'
                : 'text-indigo-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <DollarSign className="w-4 h-4 mr-3 shrink-0" />
            Caixa & Pagamentos
          </button>

          {/* HR/Personnel Option - Restricted view - Hidden for viewer or editor (RF-05.3 / RN-08) */}
          {isAdmin && (
            <button
              id="tab-pessoal"
              onClick={() => setActiveTab('pessoal')}
              className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold transition-all focus:outline-none ${
                activeTab === 'pessoal'
                  ? 'bg-white/15 text-white shadow-md border-l-4 border-indigo-400'
                  : 'text-indigo-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Briefcase className="w-4 h-4 mr-3 shrink-0" />
              Pessoal (Admin)
            </button>
          )}

          {/* System users Role - Restricted view (RF-06) */}
          {isAdmin && (
            <button
              id="tab-usuarios"
              onClick={() => setActiveTab('usuarios')}
              className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold transition-all focus:outline-none ${
                activeTab === 'usuarios'
                  ? 'bg-white/15 text-white shadow-md border-l-4 border-indigo-400'
                  : 'text-indigo-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Settings className="w-4 h-4 mr-3 shrink-0" />
              Acessos de Usuários
            </button>
          )}
        </nav>

        {/* Logout bottom attachment */}
        <div className="p-3 border-t border-white/10 bg-black/20">
          <button
            id="btn-logout"
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-300 hover:text-rose-100 hover:bg-red-500/20 border border-red-500/10 transition-colors focus:outline-none"
          >
            <LogOut className="w-4 h-4 mr-3 shrink-0" />
            Encerrar Sessão
          </button>
        </div>
      </aside>

      {/* Main Panel Side */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Sub Header bar */}
        <header className="glass-header h-18 py-4 px-6 md:px-8 flex items-center justify-between shrink-0 shadow-lg">
          <div className="flex items-center space-x-2">
            <h2 className="font-extrabold text-white text-lg md:text-xl tracking-tight">
              {activeTab === 'aulas' && 'Aulas ao Vivo'}
              {activeTab === 'professores' && 'Cadastro de Professores'}
              {activeTab === 'pagamentos' && 'Caixa & Pagamentos'}
              {activeTab === 'pessoal' && 'Ficha de Pessoal & Salários'}
              {activeTab === 'usuarios' && 'Controle de Acessos Acadêmicos'}
            </h2>
            <span className="text-white/20 hidden sm:inline">|</span>
            <span className="text-xs text-indigo-200/80 font-medium hidden sm:inline">
              {activeTab === 'aulas' && 'Aulas agendadas e links de gravação.'}
              {activeTab === 'professores' && 'Encontre, crie ou altere status de docentes.'}
              {activeTab === 'pagamentos' && 'Histórico financeiro, atrasados e quitações rápidas.'}
              {activeTab === 'pessoal' && 'Visualização de salários e equipe operacional.'}
              {activeTab === 'usuarios' && 'Permissões específicas de cargos (admin, editor, viewer).'}
            </span>
          </div>

          <div className="text-xs text-indigo-300 font-mono font-semibold hidden lg:block bg-white/5 border border-white/10 px-3 py-1.5 rounded-full backdrop-blur-md">
            Fuso Horário Local Ativo
          </div>
        </header>

        {/* Content Box */}
        <div className="p-6 md:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'aulas' && <AulasPanel userRole={user.role} />}
          {activeTab === 'professores' && <ProfessoresPanel userRole={user.role} />}
          {activeTab === 'pagamentos' && <PagamentosPanel userRole={user.role} />}
          
          {/* Render and double enforce personnel constraints */}
          {activeTab === 'pessoal' && (
            <PessoalPanel userRole={user.role} />
          )}

          {/* Render and double enforce system profiles */}
          {activeTab === 'usuarios' && (
            <UsuariosPanel currentUser={user} />
          )}
        </div>
      </main>
    </div>
  );
}
