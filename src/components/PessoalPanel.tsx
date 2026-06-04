/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PessoalService } from '../services/PessoalService';
import { Staff, StaffStatus, UserRole } from '../services/db';
import { Plus, Search, Filter, Download, Edit2, Lock, X, Briefcase, Eye, EyeOff } from 'lucide-react';
import { downloadCSV, formatCSVDate } from '../utils/csvExport';

interface PessoalPanelProps {
  userRole: UserRole;
}

export function PessoalPanel({ userRole }: PessoalPanelProps) {
  // Double-enforcement check (RLS)
  if (userRole !== 'admin') {
    return (
      <div id="unauthorized-pessoal" className="bg-red-50 border border-red-200 p-8 rounded-xl text-center shadow-xs">
        <Lock className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-red-800">Acesso Não Autorizado</h3>
        <p className="text-slate-650 text-sm mt-1 max-w-md mx-auto">
          Regra de Negócio (RN-08): O módulo Pessoal contém dados de cargos e salários sensíveis e está restrito exclusivamente para administradores do sistema.
        </p>
      </div>
    );
  }

  const [staffList, setStaffList] = useState<Staff[]>(() => PessoalService.getStaff(userRole));
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | StaffStatus>('todos');

  // Modal / Creation States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    email: '',
    phone: '',
    admissionDate: '',
    status: 'ativo' as StaffStatus,
    salary: '', // input text for styling
    observations: '',
  });
  const [modalError, setModalError] = useState('');

  const refreshList = () => {
    setStaffList(PessoalService.getStaff(userRole));
  };

  const filteredStaff = staffList.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.role.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'todos' ? true : s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenCreate = () => {
    setCurrentStaff(null);
    setFormData({
      name: '',
      role: '',
      email: '',
      phone: '',
      admissionDate: new Date().toISOString().split('T')[0],
      status: 'ativo',
      salary: '',
      observations: '',
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (staff: Staff) => {
    setCurrentStaff(staff);
    setFormData({
      name: staff.name,
      role: staff.role,
      email: staff.email,
      phone: staff.phone,
      admissionDate: staff.admissionDate,
      status: staff.status,
      salary: String(staff.salary),
      observations: staff.observations || '',
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setModalError('O nome do funcionário é obrigatório.');
      return;
    }
    const salVal = parseFloat(formData.salary);
    if (isNaN(salVal) || salVal < 0) {
      setModalError('Favor inserir um salário válido (maior ou igual a R$ 0,00).');
      return;
    }

    try {
      if (currentStaff) {
        PessoalService.updateStaff(userRole, currentStaff.id, {
          name: formData.name,
          role: formData.role,
          email: formData.email,
          phone: formData.phone,
          admissionDate: formData.admissionDate,
          status: formData.status,
          salary: salVal,
          observations: formData.observations,
        });
      } else {
        PessoalService.createStaff(userRole, {
          name: formData.name,
          role: formData.role,
          email: formData.email,
          phone: formData.phone,
          admissionDate: formData.admissionDate,
          status: formData.status,
          salary: salVal,
          observations: formData.observations,
        });
      }
      refreshList();
      setIsModalOpen(false);
    } catch (err: any) {
      setModalError(err.message || 'Erro ao gravar os dados.');
    }
  };

  const handleSoftDelete = (staff: Staff) => {
    if (window.confirm(`Deseja desativar o funcionário ${staff.name}? O status passará a inativo.`)) {
      try {
        PessoalService.deactivateStaff(userRole, staff.id);
        refreshList();
      } catch (err: any) {
        alert(err.message || 'Erro ao desativar.');
      }
    }
  };

  const handleExportCSV = () => {
    // Salary column is strictly excluded (RF-05.8 / RN-07)
    const headers = ['Funcionário', 'Cargo', 'E-mail', 'Telefone', 'Data de Admissão', 'Status', 'Data de Desligamento', 'Observações'];
    const rows = filteredStaff.map(s => [
      s.name,
      s.role,
      s.email,
      s.phone,
      formatCSVDate(s.admissionDate),
      s.status.toUpperCase(),
      s.terminationDate ? formatCSVDate(s.terminationDate) : '-',
      s.observations || ''
    ]);

    const formattedDate = new Date().toISOString().split('T')[0];
    downloadCSV(`pessoal_funcionarios_${formattedDate}.csv`, headers, rows);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 glass-card rounded-2xl shadow-xl">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-300" />
            <input
              id="search-staff-query"
              type="text"
              placeholder="Buscar por funcionário ou cargo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full h-10 glass-input rounded-xl text-sm focus:outline-none font-medium"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-indigo-300 shrink-0" />
            <select
              id="filter-staff-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 h-10 w-full glass-input rounded-xl text-sm focus:outline-none"
            >
              <option value="todos">Status: Todos</option>
              <option value="ativo">Status: Ativo</option>
              <option value="inativo">Status: Inativo</option>
              <option value="férias">Status: Em Férias</option>
              <option value="afastado">Status: Afastado</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-export-staff"
            onClick={handleExportCSV}
            className="flex items-center justify-center px-4 h-10 text-sm font-semibold text-white glass-button rounded-xl hover:bg-white/15 transition-all focus:outline-none cursor-pointer"
          >
            <Download className="w-4 h-4 mr-2 text-indigo-300" />
            Exportar CSV (Sem Salários)
          </button>
          
          <button
            id="btn-new-staff"
            onClick={handleOpenCreate}
            className="flex items-center justify-center px-4 h-10 text-sm font-semibold text-white glass-button-primary rounded-xl transition-all focus:outline-none cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Contratar Funcionário
          </button>
        </div>
      </div>

      {/* Grid listing */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-left">
            <thead className="glass-table-header">
              <tr>
                <th scope="col" className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Nome do Funcionário</th>
                <th scope="col" className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Cargo Ocupado</th>
                <th scope="col" className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Contato</th>
                <th scope="col" className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Admissão</th>
                <th scope="col" className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Status</th>
                {/* Note: No salary header column here according to RF-05.5 */}
                <th scope="col" className="px-6 py-3.5 text-right text-xs font-bold uppercase tracking-wider">Contratos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-transparent text-sm">
              {filteredStaff.length > 0 ? (
                filteredStaff.map((staff) => (
                  <tr key={staff.id} className="glass-table-row transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-white">
                      {staff.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-slate-200">
                        <Briefcase className="w-3.5 h-3.5 text-indigo-300 mr-1.5" />
                        {staff.role}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-slate-200">{staff.email}</div>
                      <div className="text-xs text-indigo-200/50">{staff.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-350">
                      {formatCSVDate(staff.admissionDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {staff.status === 'ativo' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold glass-badge-green">
                          Ativo
                        </span>
                      )}
                      {staff.status === 'inativo' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold glass-badge-red opacity-65">
                          Inativo
                        </span>
                      )}
                      {staff.status === 'férias' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold glass-badge-blue">
                          Em Férias
                        </span>
                      )}
                      {staff.status === 'afastado' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold glass-badge-amber">
                          Afastado
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          title="Ficha Cadastral"
                          onClick={() => handleOpenEdit(staff)}
                          className="p-1 px-3 text-white bg-white/5 border border-white/15 hover:bg-white/15 transition-all rounded-md flex items-center gap-1 text-xs cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3 text-indigo-300" />
                          Ficha (Salário)
                        </button>

                        {staff.status !== 'inativo' && (
                          <button
                            title="Desativar (Desligar)"
                            onClick={() => handleSoftDelete(staff)}
                            className="p-1 px-3 text-rose-300 border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 rounded-md transition-all flex items-center gap-1 text-xs cursor-pointer"
                          >
                            Recindir
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Nenhum colaborador registrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-modal rounded-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="bg-black/25 text-white px-6 py-4 flex items-center justify-between border-b border-white/10">
              <h3 className="font-extrabold text-white text-lg tracking-tight">
                {currentStaff ? 'Ficha de Colaborador (Cargo/Salário)' : 'Contratar Colaborador'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {modalError && (
                <div className="bg-red-500/15 border-l-4 border-red-500 p-2.5 rounded-r text-sm text-red-205 font-medium">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 text-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="staff-form-name" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Nome do Colaborador <span className="text-rose-450">*</span>
                    </label>
                    <input
                      id="staff-form-name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Marcos Dias"
                      className="w-full px-4 py-2.5 glass-input rounded-xl text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="staff-form-role" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Cargo / Ocupação <span className="text-rose-450">*</span>
                    </label>
                    <input
                      id="staff-form-role"
                      type="text"
                      required
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      placeholder="Ex: Secretário Geral"
                      className="w-full px-4 py-2.5 glass-input rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-rose-500/5 p-4 rounded-xl border border-rose-500/10">
                  <div>
                    <label htmlFor="staff-form-salary" className="block text-xs font-black text-rose-300 uppercase tracking-widest mb-1.5 flex items-center">
                      <Lock className="w-3.5 h-3.5 shrink-0 mr-1 text-rose-400" />
                      Salário Mensal (R$) <span className="text-rose-450">*</span>
                    </label>
                    <input
                      id="staff-form-salary"
                      type="number"
                      step="0.01"
                      required
                      value={formData.salary}
                      onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                      placeholder="Ex: 4500.00"
                      className="w-full px-4 py-2.5 glass-input rounded-xl text-sm font-semibold text-rose-200"
                    />
                    <span className="text-[10px] text-rose-400 block mt-1 font-medium">Restrição: Visível apenas a Admins</span>
                  </div>

                  <div>
                    <label htmlFor="staff-form-admission" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Data da Admissão <span className="text-rose-450">*</span>
                    </label>
                    <input
                      id="staff-form-admission"
                      type="date"
                      required
                      value={formData.admissionDate}
                      onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                      className="w-full px-4 py-2.5 glass-input rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="staff-form-email" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      E-mail Acadêmico
                    </label>
                    <input
                      id="staff-form-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Ex: nome@escola.com"
                      className="w-full px-4 py-2.5 glass-input rounded-xl text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="staff-form-phone" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Telefone / Celular
                    </label>
                    <input
                      id="staff-form-phone"
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                      className="w-full px-4 py-2.5 glass-input rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="staff-form-status" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Status Atual do Colaborador
                  </label>
                  <select
                    id="staff-form-status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-4 py-2.5 glass-input rounded-xl text-sm bg-transparent"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo (Desligado)</option>
                    <option value="férias">Em Férias</option>
                    <option value="afastado">Afastado</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="staff-form-obs" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Notas de Desempenho / Anotações
                  </label>
                  <textarea
                    id="staff-form-obs"
                    value={formData.observations}
                    onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                    rows={2}
                    placeholder="Contrato, benefícios agregados, etc."
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
                  id="btn-save-staff"
                  type="submit"
                  className="px-5 py-2 glass-button-primary rounded-xl text-sm font-semibold text-white transition-all cursor-pointer"
                >
                  Confirmar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
