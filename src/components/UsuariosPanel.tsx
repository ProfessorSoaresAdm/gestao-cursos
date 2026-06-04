/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserService } from '../services/UserService';
import { User, UserRole } from '../services/db';
import { Lock, UserCheck, UserX, UserPlus, X, RefreshCw } from 'lucide-react';

interface UsuariosPanelProps {
  currentUser: User;
}

export function UsuariosPanel({ currentUser }: UsuariosPanelProps) {
  if (currentUser.role !== 'admin') {
    return (
      <div id="unauthorized-usuarios" className="bg-red-50 border border-red-200 p-8 rounded-xl text-center shadow-xs">
        <Lock className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-red-800">Acesso Restrito</h3>
        <p className="text-slate-600 text-sm mt-1 max-w-md mx-auto">
          O gerenciamento de acessos acadêmicos e cargos do sistema é reservado exclusivamente para utilizadores de perfil Administrador.
        </p>
      </div>
    );
  }

  const [users, setUsers] = useState<User[]>(() => UserService.getAllUsers());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'viewer' as UserRole,
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const refreshList = () => {
    setUsers(UserService.getAllUsers());
  };

  const handleChangeRole = (userId: string, targetRole: UserRole) => {
    try {
      setErrorMsg('');
      setSuccessMsg('');
      UserService.updateUserRole(userId, targetRole, currentUser.email);
      setSuccessMsg('Nível de acesso alterado com sucesso!');
      refreshList();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao alterar permissão.');
    }
  };

  const handleToggleActive = (userId: string) => {
    try {
      setErrorMsg('');
      setSuccessMsg('');
      UserService.toggleUserStatus(userId, currentUser.email);
      setSuccessMsg('Status do usuário alterado com sucesso!');
      refreshList();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao alterar status.');
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!formData.name.trim()) {
      setErrorMsg('O nome do usuário é obrigatório.');
      return;
    }
    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      setErrorMsg('Informe um endereço de e-mail válido.');
      return;
    }

    try {
      UserService.createUser(formData.name, formData.email, formData.role);
      setSuccessMsg(`Usuário ${formData.name} cadastrado com sucesso!`);
      setFormData({ name: '', email: '', role: 'viewer' });
      setIsCreateOpen(false);
      refreshList();
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao processar cadastro do usuário.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Messages */}
      {successMsg && (
        <div className="bg-emerald-500/15 border-l-4 border-emerald-500 p-3.5 rounded-lg text-sm text-emerald-305 font-bold">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-500/15 border-l-4 border-red-500 p-3.5 rounded-lg text-sm text-rose-300 font-bold animate-shake">
          {errorMsg}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 glass-card rounded-2xl shadow-xl">
        <div>
          <h3 className="font-extrabold text-white text-lg tracking-tight">Gerenciamento de Usuários</h3>
          <p className="text-slate-350 text-xs">Atribua permissões e altere permissões de escrita/leitura no banco de dados.</p>
        </div>
        
        <button
          id="btn-add-system-user"
          onClick={() => {
            setErrorMsg('');
            setSuccessMsg('');
            setIsCreateOpen(true);
          }}
          className="flex items-center justify-center px-4 h-10 text-sm font-bold text-white glass-button-primary rounded-xl transition-all focus:outline-none cursor-pointer"
        >
          <UserPlus className="w-4 h-4 mr-1.5" />
          Novo Usuário
        </button>
      </div>

      {/* Grid listing of users */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-left">
            <thead className="glass-table-header">
              <tr>
                <th scope="col" className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Identificador / Nome</th>
                <th scope="col" className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">E-mail de Login</th>
                <th scope="col" className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Função de Acesso (Perfil)</th>
                <th scope="col" className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Situação</th>
                <th scope="col" className="px-6 py-3.5 text-right text-xs font-bold uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-transparent text-sm">
              {users.map((usr) => {
                const isSelf = usr.email.toLowerCase() === currentUser.email.toLowerCase();
                return (
                  <tr key={usr.id} className={`glass-table-row transition-all ${isSelf ? 'bg-white/5' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-white flex items-center">
                        {usr.name}
                        {isSelf && (
                          <span className="ml-2 text-[10px] bg-indigo-500 text-white font-semibold font-mono px-2 py-0.5 rounded tracking-wide uppercase">
                            Você
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-indigo-300/40 font-mono scale-95 origin-left">{usr.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-200">
                      {usr.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isSelf ? (
                        <span className="inline-flex items-center px-2.5 py-1 bg-white/5 text-slate-200 rounded-lg text-xs font-semibold uppercase tracking-wide border border-white/10">
                          {usr.role === 'admin' ? 'Administrador' : usr.role === 'editor' ? 'Editor' : 'Visualizador'}
                        </span>
                      ) : (
                        <select
                          id={`change-role-for-${usr.id}`}
                          value={usr.role}
                          onChange={(e) => handleChangeRole(usr.id, e.target.value as UserRole)}
                          className="px-2.5 py-1 text-xs font-semibold glass-input rounded-xl text-slate-200 focus:outline-none cursor-pointer"
                        >
                          <option value="viewer">Visualizador (viewer)</option>
                          <option value="editor">Editor (editor)</option>
                          <option value="admin">Administrador (admin)</option>
                        </select>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {usr.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold glass-badge-green">
                          Ativo (Autorizado)
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold glass-badge-red opacity-65">
                          Desativado
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                      {isSelf ? (
                        <span className="text-indigo-300/60 text-[11px] font-medium tracking-tight italic">Proteção Lockout Ativa</span>
                      ) : (
                        <button
                          id={`btn-toggle-status-${usr.id}`}
                          onClick={() => handleToggleActive(usr.id)}
                          className={`p-1.5 px-3 rounded-md border text-xs font-medium inline-flex items-center gap-1 cursor-pointer transition-all ${
                            usr.isActive 
                              ? 'text-rose-300 border-red-500/20 bg-red-500/10 hover:bg-red-500/20'
                              : 'text-emerald-305 border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20'
                          }`}
                        >
                          {usr.isActive ? (
                            <>
                              <UserX className="w-3.5 h-3.5" />
                              Desativar Login
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3.5 h-3.5" />
                              Permitir Acesso
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creation Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-modal rounded-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="bg-black/25 text-white px-5 py-3 flex items-center justify-between border-b border-white/10">
              <h3 className="font-extrabold text-white text-base">Cadastrar Novo Usuário</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Dra. Mariana Souza"
                  className="w-full px-4 py-2.5 glass-input rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">E-mail Acadêmico</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="nome@empresa.com"
                  className="w-full px-4 py-2.5 glass-input rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Função de Acesso</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-4 py-2.5 glass-input rounded-xl text-sm bg-transparent"
                >
                  <option value="viewer">Visualizador (viewer) - Somente Leitura</option>
                  <option value="editor">Editor (editor) - Cria/Atualiza Professores e Lançamentos</option>
                  <option value="admin">Administrador (admin) - Permissão total de sistema</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 bg-white/5 border border-white/10 text-slate-200 rounded-xl text-xs font-semibold hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 glass-button-primary text-xs rounded-xl hover:opacity-90 font-semibold cursor-pointer"
                >
                  Cadastrar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
