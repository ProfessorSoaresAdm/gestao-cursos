/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { AulaService } from '../services/AulaService';
import { ProfessorService } from '../services/ProfessorService';
import { ClassSession, Professor, ClassStatus, UserRole } from '../services/db';
import { Plus, Search, Filter, Download, Edit2, Check, Video, Calendar, Link as LinkIcon, X, CheckSquare, RefreshCw } from 'lucide-react';
import { downloadCSV, formatCSVDate } from '../utils/csvExport';

interface AulasPanelProps {
  userRole: UserRole;
}

export function AulasPanel({ userRole }: AulasPanelProps) {
  const [classes, setClasses] = useState<ClassSession[]>(() => AulaService.getClasses());
  const [professors] = useState<Professor[]>(() => ProfessorService.getProfessors());
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<'todos' | ClassStatus>('todos');
  const [professorFilter, setProfessorFilter] = useState<string>('todos');
  const [periodMonth, setPeriodMonth] = useState<string>('todos'); // 01 to 12
  const [periodYear, setPeriodYear] = useState<string>('todos'); // e.g. 2026

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentClass, setCurrentClass] = useState<ClassSession | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    professorId: '',
    dateTime: '',
    durationMinutes: 60,
    status: 'agendada' as ClassStatus,
    transmissionLink: '',
    recordingUrl: '',
    observations: '',
  });
  const [modalError, setModalError] = useState('');

  const isWriteAllowed = userRole === 'admin' || userRole === 'editor';
  
  const refreshList = () => {
    setClasses(AulaService.getClasses());
  };

  // Extract unique active professors for the dropdown creation
  const activeProfessors = useMemo(() => {
    return professors.filter(p => p.isActive);
  }, [professors]);

  // Extract all professors dictionary for quick lookup by ID
  const professorsMap = useMemo(() => {
    return new Map(professors.map(p => [p.id, p]));
  }, [professors]);

  // Handle parsing filtered values
  const filteredClasses = useMemo(() => {
    return classes.filter(cls => {
      // Status filter
      if (statusFilter !== 'todos' && cls.status !== statusFilter) return false;
      
      // Professor filter
      if (professorFilter !== 'todos' && cls.professorId !== professorFilter) return false;

      // Period filter
      if (cls.dateTime) {
        // e.g. "2026-06-03T14:00"
        const [datePart] = cls.dateTime.split('T');
        const [year, month] = datePart.split('-');

        if (periodYear !== 'todos' && year !== periodYear) return false;
        if (periodMonth !== 'todos' && month !== periodMonth) return false;
      }

      return true;
    });
  }, [classes, statusFilter, professorFilter, periodMonth, periodYear]);

  // Handle opening modal for create
  const handleOpenCreate = () => {
    if (activeProfessors.length === 0) {
      alert('Aviso: Você precisa cadastrar ao menos um professor ativo para criar aulas.');
      return;
    }
    setCurrentClass(null);
    setFormData({
      title: '',
      professorId: activeProfessors[0]?.id || '',
      dateTime: new Date().toISOString().substring(0, 16), // current datetime formatted for input datetime-local
      durationMinutes: 60,
      status: 'agendada',
      transmissionLink: '',
      recordingUrl: '',
      observations: '',
    });
    setModalError('');
    setIsModalOpen(true);
  };

  // Handle opening modal for edit
  const handleOpenEdit = (cls: ClassSession) => {
    setCurrentClass(cls);
    setFormData({
      title: cls.title,
      professorId: cls.professorId,
      dateTime: cls.dateTime,
      durationMinutes: cls.durationMinutes,
      status: cls.status,
      transmissionLink: cls.transmissionLink || '',
      recordingUrl: cls.recordingUrl || '',
      observations: cls.observations || '',
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setModalError('O título da aula é obrigatório.');
      return;
    }
    if (!formData.professorId) {
      setModalError('Escolha um professor de ensino para realizar o vínculo.');
      return;
    }
    if (!formData.dateTime) {
      setModalError('Selecione o dia e hora desta sessão.');
      return;
    }
    if (formData.durationMinutes <= 0) {
      setModalError('A duração deve ser superior a 0 minutos.');
      return;
    }

    try {
      if (currentClass) {
        AulaService.updateClass(currentClass.id, {
          title: formData.title,
          professorId: formData.professorId,
          dateTime: formData.dateTime,
          durationMinutes: Number(formData.durationMinutes),
          status: formData.status,
          transmissionLink: formData.transmissionLink,
          recordingUrl: formData.status === 'realizada' ? formData.recordingUrl : undefined,
          observations: formData.observations,
        });
      } else {
        AulaService.createClass({
          title: formData.title,
          professorId: formData.professorId,
          dateTime: formData.dateTime,
          durationMinutes: Number(formData.durationMinutes),
          status: formData.status,
          transmissionLink: formData.transmissionLink,
          recordingUrl: formData.status === 'realizada' ? formData.recordingUrl : undefined,
          observations: formData.observations,
        });
      }
      refreshList();
      setIsModalOpen(false);
    } catch (err: any) {
      setModalError(err.message || 'Erro ao registrar os dados.');
    }
  };

  // Row inline state transformation
  const handleFastStatusChange = (classId: string, nextStatus: ClassStatus) => {
    try {
      AulaService.updateClassStatus(classId, nextStatus);
      refreshList();
    } catch (err: any) {
      alert(err.message || 'Erro ao modificar status rapidamente.');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Título da Aula', 'ID do Professor', 'Professor Vinculado', 'Data/Hora', 'Duração (Minutos)', 'Status', 'Link de Transmissão', 'URL de Gravação', 'Observações'];
    const rows = filteredClasses.map(cls => {
      const profName = professorsMap.get(cls.professorId)?.name || 'Desconhecido';
      return [
        cls.title,
        cls.professorId,
        profName,
        formatCSVDate(cls.dateTime),
        cls.durationMinutes,
        cls.status.toUpperCase(),
        cls.transmissionLink || '',
        cls.recordingUrl || '',
        cls.observations || ''
      ];
    });

    const formattedDate = new Date().toISOString().split('T')[0];
    downloadCSV(`aulas_agendadas_${formattedDate}.csv`, headers, rows);
  };

  const formatBeautifulDateTime = (dateTimeStr: string) => {
    if (!dateTimeStr) return '';
    const [datePart, timePart] = dateTimeStr.split('T');
    const [year, month, day] = datePart.split('-');
    return `${day}/${month}/${year} às ${timePart}`;
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Drawer */}
      <div className="glass-card rounded-2xl p-5 shadow-xl space-y-4">
        <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Painel de Filtros Avançados</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
          {/* Status Filter */}
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-semibold text-slate-300">Status</label>
            <select
              id="filter-class-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-sm px-3 h-10 glass-input rounded-xl focus:outline-none"
            >
              <option value="todos">Todos os Status</option>
              <option value="agendada">Agendada</option>
              <option value="realizada">Realizada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          {/* Professor Select Filter */}
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-semibold text-slate-300">Filtrar por Professor</label>
            <select
              id="filter-class-prof"
              value={professorFilter}
              onChange={(e) => setProfessorFilter(e.target.value)}
              className="text-sm px-3 h-10 glass-input rounded-xl focus:outline-none"
            >
              <option value="todos">Todos os Professores</option>
              {professors.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} {!p.isActive && '(Inativo)'}
                </option>
              ))}
            </select>
          </div>

          {/* Period - Month */}
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-semibold text-slate-300">Mês</label>
            <select
              id="filter-class-month"
              value={periodMonth}
              onChange={(e) => setPeriodMonth(e.target.value)}
              className="text-sm px-3 h-10 glass-input rounded-xl focus:outline-none"
            >
              <option value="todos">Todos os Meses</option>
              <option value="01">Janeiro (01)</option>
              <option value="02">Fevereiro (02)</option>
              <option value="03">Março (03)</option>
              <option value="04">Abril (04)</option>
              <option value="05">Maio (05)</option>
              <option value="06">Junho (06)</option>
              <option value="07">Julho (07)</option>
              <option value="08">Agosto (08)</option>
              <option value="09">Setembro (09)</option>
              <option value="10">Outubro (10)</option>
              <option value="11">Novembro (11)</option>
              <option value="12">Dezembro (12)</option>
            </select>
          </div>

          {/* Period - Year */}
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-semibold text-slate-300">Ano</label>
            <select
              id="filter-class-year"
              value={periodYear}
              onChange={(e) => setPeriodYear(e.target.value)}
              className="text-sm px-3 h-10 glass-input rounded-xl focus:outline-none"
            >
              <option value="todos">Todos os Anos</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/10 pt-3">
          <button
            id="btn-export-classes"
            onClick={handleExportCSV}
            className="flex items-center justify-center px-4 h-10 text-sm font-semibold text-white glass-button rounded-xl hover:bg-white/15 transition-colors focus:outline-none"
          >
            <Download className="w-4 h-4 mr-2 text-indigo-300" />
            Exportar CSV Filtrado
          </button>

          {isWriteAllowed && (
            <button
              id="btn-new-class"
              onClick={handleOpenCreate}
              className="flex items-center justify-center px-4 h-10 text-sm font-semibold text-white glass-button-primary rounded-xl focus:outline-none"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Agendar Aula Coletiva
            </button>
          )}
        </div>
      </div>

      {/* Roster of Classes Scheduled */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-left">
            <thead className="glass-table-header">
              <tr>
                <th scope="col" className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Aula / Tópico</th>
                <th scope="col" className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Professor Responsável</th>
                <th scope="col" className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Data & Duração</th>
                <th scope="col" className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Links</th>
                {isWriteAllowed && <th scope="col" className="px-6 py-3.5 text-right text-xs font-bold uppercase tracking-wider">Controles Rápidos</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-transparent text-sm">
              {filteredClasses.length > 0 ? (
                filteredClasses.map((cls) => {
                  const prof = professorsMap.get(cls.professorId);
                  return (
                    <tr key={cls.id} className="glass-table-row transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white">{cls.title}</div>
                        {cls.observations && (
                          <div className="text-xs text-indigo-200/60 max-w-[300px] truncate" title={cls.observations}>
                            Ref: {cls.observations}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-slate-200">
                          {prof ? prof.name : 'Professor Deletado'}
                        </div>
                        <div className="text-xs text-indigo-200/50">
                          {prof?.specialty || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-slate-200 text-xs font-medium">
                          <Calendar className="w-3.5 h-3.5 mr-1.5 text-indigo-300/75" />
                          {formatBeautifulDateTime(cls.dateTime)}
                        </div>
                        <div className="text-xs text-indigo-300/50 mt-1 pl-5">
                          Duração: {cls.durationMinutes} minutos
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {cls.status === 'agendada' && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold glass-badge-amber">
                            Agendada
                          </span>
                        )}
                        {cls.status === 'realizada' && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold glass-badge-green">
                            Realizada
                          </span>
                        )}
                        {cls.status === 'cancelada' && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold glass-badge-red">
                            Cancelada
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {cls.transmissionLink ? (
                            <a
                              href={cls.transmissionLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                            >
                              <LinkIcon className="w-3 h-3 mr-1" />
                              Link da Sala
                            </a>
                          ) : (
                            <span className="text-slate-500 text-xs">-</span>
                          )}

                          {cls.status === 'realizada' && cls.recordingUrl && (
                            <a
                              href={cls.recordingUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center text-xs text-rose-400 hover:text-rose-300 font-semibold transition-colors"
                            >
                              <Video className="w-3 h-3 mr-1" />
                              Gravação
                            </a>
                          )}
                        </div>
                      </td>
                      {isWriteAllowed && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Fast status actions */}
                            {cls.status !== 'realizada' && (
                              <button
                                title="Marcar como Realizada"
                                onClick={() => handleFastStatusChange(cls.id, 'realizada')}
                                className="p-1.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 rounded-md hover:bg-emerald-500/25 transition-colors cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}
                            
                            {cls.status !== 'cancelada' && (
                              <button
                                title="Cancelar Aula"
                                onClick={() => handleFastStatusChange(cls.id, 'cancelada')}
                                className="p-1.5 bg-white/5 text-slate-300 border border-white/10 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {cls.status === 'cancelada' && (
                              <button
                                title="Reagendar"
                                onClick={() => handleFastStatusChange(cls.id, 'agendada')}
                                className="p-1.5 bg-amber-500/10 text-amber-300 border border-amber-500/25 rounded-md hover:bg-amber-500/25 transition-colors cursor-pointer"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <span className="text-white/10 mx-1">|</span>

                            <button
                              id={`btn-edit-class-${cls.id}`}
                              onClick={() => handleOpenEdit(cls)}
                              className="p-1.5 bg-white/5 border border-white/15 text-white rounded-md hover:bg-white/15 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3 text-indigo-300" />
                              Ficha
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Nenhuma aula registrada sob as categorias de filtros selecionadas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-modal rounded-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="bg-black/25 text-white px-6 py-4 flex items-center justify-between border-b border-white/10">
              <h3 className="font-extrabold text-white text-lg tracking-tight">
                {currentClass ? 'Modificar Aula Cadastrada font-bold' : 'Registrar Agenda de Aula'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {modalError && (
                <div className="bg-red-500/15 border-l-4 border-red-500 p-3 rounded-r text-sm text-red-200 font-semibold">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 text-slate-200">
                <div>
                  <label htmlFor="class-form-title" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Título / Tópico Curricular <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="class-form-title"
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Introdução à Eletrodinâmica"
                    className="w-full px-4 py-2.5 glass-input rounded-xl text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="class-form-prof" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Professor Responsável <span className="text-rose-400">*</span>
                    </label>
                    <select
                      id="class-form-prof"
                      required
                      value={formData.professorId}
                      onChange={(e) => setFormData({ ...formData, professorId: e.target.value })}
                      className="w-full px-4 py-2.5 glass-input rounded-xl text-sm"
                    >
                      <option value="">Selecione um Professor...</option>
                      {activeProfessors.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.specialty})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="class-form-dateTime" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Data e Hora <span className="text-rose-400">*</span>
                    </label>
                    <input
                      id="class-form-dateTime"
                      type="datetime-local"
                      required
                      value={formData.dateTime}
                      onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
                      className="w-full px-4 py-2.5 glass-input rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="class-form-duration" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Duração (em Minutos) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      id="class-form-duration"
                      type="number"
                      required
                      min={10}
                      value={formData.durationMinutes}
                      onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 glass-input rounded-xl text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="class-form-status" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Estado da Aula
                    </label>
                    <select
                      id="class-form-status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-4 py-2.5 glass-input rounded-xl text-sm"
                    >
                      <option value="agendada">Agendada</option>
                      <option value="realizada">Realizada</option>
                      <option value="cancelada">Cancelada</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="class-form-link" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Link de Transmissão (Sala Virtual)
                  </label>
                  <input
                    id="class-form-link"
                    type="url"
                    value={formData.transmissionLink}
                    onChange={(e) => setFormData({ ...formData, transmissionLink: e.target.value })}
                    placeholder="https://meet.google.com/abc-defg-hij"
                    className="w-full px-4 py-2.5 glass-input rounded-xl text-sm"
                  />
                </div>

                {/* Conditional show of Recording URL if realized */}
                {formData.status === 'realizada' && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl animate-in slide-in-from-top-2 duration-100">
                    <label htmlFor="class-form-recording" className="block text-xs font-bold text-emerald-300 uppercase tracking-wider mb-1">
                      Link / URL da Gravação (Opcional)
                    </label>
                    <input
                      id="class-form-recording"
                      type="url"
                      value={formData.recordingUrl}
                      onChange={(e) => setFormData({ ...formData, recordingUrl: e.target.value })}
                      placeholder="Ex: https://drive.google.com/... ou YouTube link"
                      className="w-full px-3 py-2 border border-emerald-500/30 bg-black/10 text-white rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="class-form-obs" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Observações de Aula
                  </label>
                  <textarea
                    id="class-form-obs"
                    value={formData.observations}
                    onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                    rows={2}
                    placeholder="Tópicos vistos, deveres de casa deixados para alunos, etc."
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
                  id="btn-save-class"
                  type="submit"
                  className="px-5 py-2 glass-button-primary rounded-xl text-sm font-semibold text-white cursor-pointer"
                >
                  Salvar Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
