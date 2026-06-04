/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserService } from '../services/UserService';
import { User } from '../services/db';
import { LogIn, HelpCircle } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor, informe seu e-mail.');
      return;
    }

    try {
      const user = UserService.login(email);
      if (user) {
        onLoginSuccess(user);
      } else {
        setError('E-mail não cadastrado no sistema d\'Alunos acadêmico.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro inesperado.');
    }
  };

  const handleQuickLogin = (emailChoice: string) => {
    setError('');
    setEmail(emailChoice);
    try {
      const user = UserService.login(emailChoice);
      if (user) {
        onLoginSuccess(user);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div id="login-container" className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="glass-card font-bold p-3 rounded-2xl flex items-center justify-center space-x-2 shadow-lg">
            <span className="text-xl uppercase tracking-wider font-mono text-white">GE</span>
            <span className="border-l border-white/20 pl-2 text-sm text-indigo-200">Gestão Escolar</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-white">
          Entrar no Sistema
        </h2>
        <p className="mt-2 text-center text-sm text-indigo-200/80">
          Gerenciador Unificado de Ensino, Pagamentos e Pessoal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass-card py-8 px-4 sm:px-10 rounded-3xl shadow-2xl">
          {error && (
            <div className="mb-4 bg-red-500/10 border-l-4 border-red-500 p-3 rounded-r text-sm text-red-200 font-medium">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-200">
                Endereço de E-mail
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="exemplo@empresa.com"
                  className="appearance-none block w-full px-4 h-11 glass-input rounded-xl placeholder-slate-400 text-sm focus:outline-none"
                />
              </div>
            </div>

            <button
              id="btn-submit-login"
              type="submit"
              className="w-full flex justify-center items-center py-2.5 px-4 h-11 glass-button-primary rounded-xl text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Acessar Painel
            </button>
          </form>

          <div className="mt-8 border-t border-white/10 pt-6">
            <div className="flex items-center space-x-1.5 mb-4 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>Contas de Teste (Perfis de Acesso)</span>
            </div>
            
            <div className="grid grid-cols-1 gap-2.5">
              <button
                id="quick-login-admin"
                type="button"
                onClick={() => handleQuickLogin('admin@empresa.com')}
                className="w-full flex items-center justify-between px-3.5 py-2 text-left glass-card glass-card-hover rounded-xl text-xs transition-colors"
              >
                <div>
                  <div className="font-bold text-slate-100">Administrador (admin)</div>
                  <div className="text-slate-400">Acesso total - modulo Pessoal & Usuários</div>
                </div>
                <span className="bg-white/10 text-slate-100 px-2.5 py-0.5 rounded-lg border border-white/10 font-mono font-bold scale-95">Link</span>
              </button>

              <button
                id="quick-login-editor"
                type="button"
                onClick={() => handleQuickLogin('editor@empresa.com')}
                className="w-full flex items-center justify-between px-3.5 py-2 text-left glass-card glass-card-hover rounded-xl text-xs transition-colors"
              >
                <div>
                  <div className="font-bold text-slate-100">Editor (editor)</div>
                  <div className="text-slate-400">Cria e edita Aulas, Pagos e Professores</div>
                </div>
                <span className="bg-white/10 text-slate-100 px-2.5 py-0.5 rounded-lg border border-white/10 font-mono font-bold scale-95">Link</span>
              </button>

              <button
                id="quick-login-viewer"
                type="button"
                onClick={() => handleQuickLogin('viewer@empresa.com')}
                className="w-full flex items-center justify-between px-3.5 py-2 text-left glass-card glass-card-hover rounded-xl text-xs transition-colors"
              >
                <div>
                  <div className="font-bold text-slate-100">Visualizador (viewer)</div>
                  <div className="text-slate-400">Leitura estruturada - Sem permissão de escrita</div>
                </div>
                <span className="bg-white/10 text-slate-100 px-2.5 py-0.5 rounded-lg border border-white/10 font-mono font-bold scale-95">Link</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
