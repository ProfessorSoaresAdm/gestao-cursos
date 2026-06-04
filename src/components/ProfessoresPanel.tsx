/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ProfessorService } from '../services/ProfessorService';
import { Professor, UserRole } from '../services/db';
import { Plus, Search, Filter, Download, Edit2, UserCheck, UserX, X } from 'lucide-react';
import { downloadCSV, formatCSVDate } from '../utils/csvExport';

interface ProfessoresPanelProps {
  userRole: UserRole;
}

export function ProfessoresPanel({ userRole }: ProfessoresPanelProps) {
  const [professors, setProfessors] = useState<Professor[]>(() => ProfessorService.getProfessors());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativos' | 'inativos'>('todos');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProf, setCurrentProf] = useState<Professor | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: '',
    document: '', // CPF
    address: '',
    observations: '',
  });
  const [modalError, setModalError] = useState('');

  const isWriteAllowed = userRole === 'admin' || userRole === 'editor';

  const refreshList = () => {
    setProfessors(ProfessorService.getProfessors());
  };

  // Filtered list
  const filteredProfessors = professors.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = 
      statusFilter === 'todos' ? true :
      statusFilter === 'ativos' ? p.isActive :
      !p.isActive;
    return matchesSearch && matchesStatus;
  });

  const handleOpenCreate = () => {
    setCurrentProf(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      specialty: '',
      document: '',
      address: '',
      observations: '',
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prof: Professor) => {
    setCurrentProf(prof);
    setFormData({
      name: prof.name,
      email: prof.email,
      phone: prof.phone,
      specialty: prof.specialty,
      document: prof.document,
      address: prof.address,
      observations: prof.observations,
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setModalError('O nome do professor é obrigatório.');
      return;
    }
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      setModalError('Formato de e-mail inválido.');
      return;
    }

    try {
      if (currentProf) {
        // Edit
        ProfessorService.updateProfessor(currentProf.id, formData);
      } else {
        // Create
        ProfessorService.createProfessor({
          ...formData,
          isActive: true,
        });
      }
      refreshList();
      setIsModalOpen(false);
    } catch (err: any) {
      setModalError(err.message || 'Erro ao salvar professor.');
    }
  };

  const handleToggleActive = (prof: Professor) => {
    const confirmMessage = prof.isActive 
      ? `Tem certeza que deseja desativar o professor ${prof.name}? Ele não poderá ser vinculado a novas aulas ou pagamentos.`
      : `Deseja reativar o professor ${prof.name}?`;
      
    if (window.confirm(confirmMessage)) {
      try {
        if (prof.isActive) {
          ProfessorService.deactivateProfessor(prof.id);
        } else {
          ProfessorService.activateProfessor(prof.id);
        }
        refreshList();
      } catch (err: any) {
        alert(err.message || 'Erro ao alterar status.');
      }
    }
  };

  const handleExportCSV = () => {
    const headers = ['Nome', 'Fidelidade/Especialidade', 'E-mail', 'Telefone', 'Documento (CPF)', 'Endereço', 'Status', 'Observações'];
    const rows = filteredProfessors.map(p => [
      p.name,
      p.specialty,
      p.email,
      p.phone,
      p.document,
      p.address,
      p.isActive ? 'Ativo' : 'Inativo',
      p.observations
    ]);
    
    const formattedDate = new Date().toISOString().split('T')[0];
    downloadCSV(`professores_filtrados_${formattedDate}.csv`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Search and actions bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 glass-card rounded-2xl shadow-xl">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-300" />
            <input
              id="search-prof-name"
              type="text"
              placeholder="Buscar professor por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full h-10 glass-input rounded-xl focus:outline-none text-sm font-medium"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-indigo-300 shrink-0" />
            <select
              id="filter-prof-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 h-10 w-full glass-input rounded-xl focus:outline-none text-sm"
            >
              <option value="todos">Status: Todos</option>
              <option value="ativos">Status: Ativos</option>
              <option value="inativos">Status: Inativos</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-export-professors"
            onClick={handleExportCSV}
            className="flex items-center justify-center px-4 h-10 text-sm font-semibold text-white glass-button rounded-xl hover:bg-white/15 transition-all focus:outline-none cursor-pointer"
          >
            <Download className="w-4 h-4 mr-2 text-indigo-300" />
            Exportar CSV
          </button>

          {isWriteAllowed && (
            <button
              id="btn-new-professor"
              onClick={handleOpenCreate}
              className="flex items-center justify-center px-4 h-10 text-sm font-semibold text-white glass-button-primary rounded-xl transition-all focus:outline-none cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Novo Professor
            </button>
          )}
        </div>
      </div>

      {/* Roster list */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-left">
            <thead className="glass-table-header">
              <tr>
                <th scope="col" className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Professor</th>
                <th scope="col" className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Especialidade / Matéria</th>
                <th scope="col" className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Contatos</th>
                <th scope="col" className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">CPF</th>
                <th scope="col" className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Status</th>
                {isWriteAllowed && <th scope="col" className="px-6 py-3.5 text-right text-xs font-bold uppercase tracking-wider">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-transparent text-sm">
              {filteredProfessors.length > 0 ? (
                filteredProfessors.map((prof) => (
                  <tr key={prof.id} className="glass-table-row transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-white">{prof.name}</div>
                      <div className="text-xs text-indigo-300/50 max-w-[200px] truncate" title={prof.address}>
                        {prof.address || 'Sem endereço cadastrado'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold glass-badge-amber">
                        {prof.specialty || 'Não informada'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-slate-200 font-medium">{prof.email || '-'}</div>
                      <div className="text-xs text-indigo-200/50">{prof.phone || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-indigo-200/80">
                      {prof.document || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {prof.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold glass-badge-green">
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold glass-badge-red">
                          Inativo
                        </span>
                      )}
                    </td>
                    {isWriteAllowed && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            id={`btn-edit-prof-${prof.id}`}
                            title="Editar Dados"
                            onClick={() => handleOpenEdit(prof)}
                            className="p-1 px-3 text-white bg-white/5 border border-white/15 hover:bg-white/15 transition-all rounded-md flex items-center gap-1 text-xs cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-indigo-300" />
                            Editar
                          </button>
                          
                          <button
                            title={prof.isActive ? "Desativar Professor" : "Reativar Professor"}
                            onClick={() => handleToggleActive(prof)}
                            className={`p-1 px-3 rounded-md border flex items-center gap-1 text-xs transition-all cursor-pointer ${
                              prof.isActive
                                ? 'text-red-300 border-red-500/20 bg-red-500/10 hover:bg-red-500/20'
                                : 'text-emerald-300 border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20'
                            }`}
                          >
                            {prof.isActive ? (
                              <>
                                <UserX className="w-3.5 h-3.5" />
                                Desativar
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3.5 h-3.5" />
                                Ativar
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Nenhum professor cadastrado ou correspondente aos filtros de pesquisa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Write dialog modality */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-modal rounded-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="bg-black/25 text-white px-6 py-4 flex items-center justify-between border-b border-white/10">
              <h3 className="font-extrabold text-white text-lg tracking-tight">
                {currentProf ? 'Editar Professor' : 'Registrar Novo Professor'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {modalError && (
                <div className="bg-red-500/15 border-l-4 border-red-500 p-3 rounded-r text-sm text-red-205 font-semibold">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 text-slate-200">
                <div>
                  <label htmlFor="prof-form-name" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Nome Completo <span className="text-rose-450">*</span>
                  </label>
                  <input
                    id="prof-form-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Dra. Sofia Maria Oliveira"
                    className="w-full px-4 py-2.5 glass-input rounded-xl text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="prof-form-specialty" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Matéria / Especialidade
                    </label>
                    <input
                      id="prof-form-specialty"
                      type="text"
                      value={formData.specialty}
                      onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                      placeholder="Ex: Matemática, Física"
                      className="w-full px-4 py-2.5 glass-input rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="prof-form-document" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      CPF (Documento)
                    </label>
                    <input
                      id="prof-form-document"
                      type="text"
                      value={formData.document}
                      onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                      placeholder="Ex: 000.000.000-00"
                      className="w-full px-4 py-2.5 glass-input rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="prof-form-email" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      E-mail
                    </label>
                    <input
                      id="prof-form-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="sofia.oliveira@escola.com"
                      className="w-full px-4 py-2.5 glass-input rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="prof-form-phone" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Telefone
                    </label>
                    <input
                      id="prof-form-phone"
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                      className="w-full px-4 py-2.5 glass-input rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="prof-form-address" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Endereço Completo
                  </label>
                  <input
                    id="prof-form-address"
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Ex: Avenida Paulista, 1500, apto 41 - São Paulo"
                    className="w-full px-4 py-2.5 glass-input rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="prof-form-observations" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Observações Internas
                  </label>
                  <textarea
                    id="prof-form-observations"
                    value={formData.observations}
                    onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                    rows={2}
                    placeholder="Informações adicionais sobre o contrato ou disponibilidade horária."
                    className="w-full px-4 py-2.5 glass-input rounded-xl text-sm resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white/5 border border-white/10 text-slate-200 rounded-xl text-sm font-semibold hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  id="btn-save-professor"
                  type="submit"
                  className="px-5 py-2 glass-button-primary rounded-xl text-sm font-semibold text-white transition-all cursor-pointer"
                >
                  Salvar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
