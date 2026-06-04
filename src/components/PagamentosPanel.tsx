/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { PagamentoService } from '../services/PagamentoService';
import { ProfessorService } from '../services/ProfessorService';
import { AulaService } from '../services/AulaService';
import { Payment, Professor, ClassSession, PaymentStatus, PaymentMethod, UserRole } from '../services/db';
import { Plus, Search, Filter, Download, CheckSquare, X, DollarSign, Calendar, RefreshCw, AlertCircle } from 'lucide-react';
import { downloadCSV, formatCSVDate, formatCSVCurrency } from '../utils/csvExport';

interface PagamentosPanelProps {
  userRole: UserRole;
}

export function PagamentosPanel({ userRole }: PagamentosPanelProps) {
  const [payments, setPayments] = useState<Payment[]>(() => PagamentoService.getPayments());
  const [professors] = useState<Professor[]>(() => ProfessorService.getProfessors());
  const [classes] = useState<ClassSession[]>(() => AulaService.getClasses());

  // Period / Filter states
  const [periodMonth, setPeriodMonth] = useState<string>('todos'); // "01" to "12"
  const [periodYear, setPeriodYear] = useState<string>('todos'); // "25", "26", etc.
  const [statusFilter, setStatusFilter] = useState<'todos' | PaymentStatus | 'atrasado'>('todos');

  // Creation form modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    professorId: '',
    classSessionId: '',
    amount: '', // numeric string
    dueDate: '',
    observations: '',
  });
  const [creationError, setCreationError] = useState('');

  // Settle (Mark as Paid) inline popup states
  const [settlingPaymentId, setSettlingPaymentId] = useState<string | null>(null);
  const [settleDate, setSettleDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [settleMethod, setSettleMethod] = useState<PaymentMethod | string>('Pix');

  const isWriteAllowed = userRole === 'admin' || userRole === 'editor';

  const professorsMap = useMemo(() => new Map(professors.map(p => [p.id, p])), [professors]);
  const classesMap = useMemo(() => new Map(classes.map(c => [c.id, c])), [classes]);

  const refreshList = () => {
    setPayments(PagamentoService.getPayments());
  };

  // Select only active professors for the creator dropdown
  const activeProfessors = useMemo(() => professors.filter(p => p.isActive), [professors]);

  // Classes filtered by selected professor in form
  const classOptionsForSelectedProfessor = useMemo(() => {
    if (!formData.professorId) return [];
    return classes.filter(cls => cls.professorId === formData.professorId);
  }, [formData.professorId, classes]);

  // Compute calculated status for each payment
  const paymentsWithCalculatedStatus = useMemo(() => {
    return payments.map(pay => ({
      ...pay,
      calculatedStatus: PagamentoService.calculateStatus(pay)
    }));
  }, [payments]);

  // Real filtered payments based on screen filter rules
  const filteredPayments = useMemo(() => {
    return paymentsWithCalculatedStatus.filter(pay => {
      // Due Month & Year Check
      if (pay.dueDate) {
        const [year, month] = pay.dueDate.split('-');
        if (periodYear !== 'todos' && year !== periodYear) return false;
        if (periodMonth !== 'todos' && month !== periodMonth) return false;
      }

      // Status Check (Note: handles computed "atrasado" value)
      if (statusFilter !== 'todos' && pay.calculatedStatus !== statusFilter) return false;

      return true;
    });
  }, [paymentsWithCalculatedStatus, periodMonth, periodYear, statusFilter]);

  // Calculate top summaries - strictly for filtered period
  const totals = useMemo(() => {
    let paidVal = 0;
    let pendingVal = 0;
    let overdueVal = 0;

    // Filtered by date ONLY to keep top cards reactive to period dropdown but independent of status filter tab
    const periodOnlyPayments = paymentsWithCalculatedStatus.filter(pay => {
      if (pay.dueDate) {
        const [year, month] = pay.dueDate.split('-');
        if (periodYear !== 'todos' && year !== periodYear) return false;
        if (periodMonth !== 'todos' && month !== periodMonth) return false;
      }
      return true;
    });

    periodOnlyPayments.forEach(p => {
      if (p.calculatedStatus === 'pago') {
        paidVal += p.amount;
      } else if (p.calculatedStatus === 'atrasado') {
        overdueVal += p.amount;
      } else if (p.calculatedStatus === 'pendente') {
        pendingVal += p.amount;
      }
    });

    return { paid: paidVal, pending: pendingVal, overdue: overdueVal };
  }, [paymentsWithCalculatedStatus, periodMonth, periodYear]);

  // Open creation modal
  const handleOpenCreateModal = () => {
    if (activeProfessors.length === 0) {
      alert('Aviso: Você precisa ter ao menos um professor ativo registrado no sistema.');
      return;
    }
    setFormData({
      description: '',
      professorId: activeProfessors[0]?.id || '',
      classSessionId: '',
      amount: '',
      dueDate: new Date().toISOString().split('T')[0],
      observations: '',
    });
    setCreationError('');
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim()) {
      setCreationError('A descrição do pagamento é obrigatória.');
      return;
    }
    if (!formData.professorId) {
      setCreationError('Selecione o professor para o lançamento.');
      return;
    }
    const valFloat = parseFloat(formData.amount);
    if (isNaN(valFloat) || valFloat <= 0) {
      setCreationError('Favor inserir um valor maior que R$ 0,00.');
      return;
    }
    if (!formData.dueDate) {
      setCreationError('Insira a data limite de vencimento.');
      return;
    }

    try {
      PagamentoService.createPayment({
        description: formData.description,
        professorId: formData.professorId,
        classSessionId: formData.classSessionId || undefined,
        amount: valFloat,
        dueDate: formData.dueDate,
        status: 'pendente',
        observations: formData.observations,
      });
      refreshList();
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setCreationError(err.message || 'Erro inesperado ao persistir pagamento.');
    }
  };

  // Open quick pay panel inline
  const handleOpenSettle = (payId: string) => {
    setSettlingPaymentId(payId);
    setSettleDate(new Date().toISOString().split('T')[0]);
    setSettleMethod('Pix');
  };

  // Submit quick payment inline
  const handleSettleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlingPaymentId) return;

    try {
      PagamentoService.markAsPaid(settlingPaymentId, settleDate, settleMethod);
      setSettlingPaymentId(null);
      refreshList();
    } catch (err: any) {
      alert(err.message || 'Falha ao confirmar pagamento.');
    }
  };

  const handleCancelPayment = (payId: string) => {
    if (window.confirm('Atenção: Deseja cancelar este pagamento? Ele será desativado logicamente no sistema (soft-delete).')) {
      try {
        PagamentoService.cancelPayment(payId);
        refreshList();
      } catch (err: any) {
        alert(err.message || 'Erro ao cancelar.');
      }
    }
  };

  const handleExportCSV = () => {
    const headers = ['Descrição do Lançamento', 'Professor', 'Aula Conectada', 'Valor', 'Data de Vencimento', 'Status Calculado', 'Data de Quitação', 'Método', 'Observações'];
    const rows = filteredPayments.map(p => {
      const profName = professorsMap.get(p.professorId)?.name || 'Desconhecido';
      const className = p.classSessionId ? (classesMap.get(p.classSessionId)?.title || 'Especial') : 'Nenhuma';
      return [
        p.description,
        profName,
        className,
        formatCSVCurrency(p.amount),
        formatCSVDate(p.dueDate),
        p.calculatedStatus.toUpperCase(),
        p.paymentDate ? formatCSVDate(p.paymentDate) : '-',
        p.paymentMethod || '-',
        p.observations
      ];
    });

    const formattedDate = new Date().toISOString().split('T')[0];
    downloadCSV(`pagamentos_relatorio_${formattedDate}.csv`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Resumen Cards (reactive to selected month/year period drop downs) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total PagoCard */}
        <div id="card-total-pago" className="glass-card border-emerald-500/20 p-5 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-emerald-300 uppercase tracking-widest mb-1.5">Total Recebido / Pago</div>
            <div className="text-2xl font-black text-white font-mono">
              {formatCSVCurrency(totals.paid)}
            </div>
          </div>
          <div className="bg-emerald-500/15 text-emerald-300 p-2.5 rounded-xl border border-emerald-500/20">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Total Pendente Card */}
        <div id="card-total-pendente" className="glass-card border-amber-500/20 p-5 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-amber-300 uppercase tracking-widest mb-1.5">Total Pendente</div>
            <div className="text-2xl font-black text-white font-mono">
              {formatCSVCurrency(totals.pending)}
            </div>
          </div>
          <div className="bg-amber-500/15 text-amber-300 p-2.5 rounded-xl border border-amber-500/20">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Total Atrasado Card */}
        <div id="card-total-atrasado" className="glass-card border-rose-500/20 p-5 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-rose-300 uppercase tracking-widest mb-1.5 font-semibold">Total Atrasado</div>
            <div className="text-2xl font-black text-white font-mono">
              {formatCSVCurrency(totals.overdue)}
            </div>
          </div>
          <div className="bg-rose-500/15 text-rose-300 p-2.5 rounded-xl border border-rose-500/20">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Roster Controls and Search Panel */}
      <div className="glass-card rounded-2xl p-5 shadow-xl space-y-4">
        <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Controles e Períodos de Lançamentos</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {/* Status Select */}
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-semibold text-slate-300">Filtrar por Status</label>
            <select
              id="filter-pay-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-sm px-3 h-10 glass-input rounded-xl focus:outline-none"
            >
              <option value="todos">Todos os Status</option>
              <option value="pago">Pago</option>
              <option value="pendente">Pendente à Vencer</option>
              <option value="atrasado">Atrasado (Vencido)</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          {/* Month Check */}
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-semibold text-slate-300">Mês do Vencimento</label>
            <select
              id="filter-pay-month"
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

          {/* Year Check */}
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-semibold text-slate-300">Ano do Vencimento</label>
            <select
              id="filter-pay-year"
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
            id="btn-export-payments"
            onClick={handleExportCSV}
            className="flex items-center justify-center px-4 h-10 text-sm font-semibold text-white glass-button rounded-xl hover:bg-white/15 transition-all focus:outline-none cursor-pointer"
          >
            <Download className="w-4 h-4 mr-2 text-indigo-300" />
            Exportar CSV de Caixa
          </button>

          {isWriteAllowed && (
            <button
              id="btn-new-payment"
              onClick={handleOpenCreateModal}
              className="flex items-center justify-center px-4 h-10 text-sm font-semibold text-white glass-button-primary rounded-xl transition-all focus:outline-none cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Lançar Novo Pagamento
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
                <th scope="col" className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Descrição / Aula Vinculada</th>
                <th scope="col" className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Professor Credor</th>
                <th scope="col" className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Valor Bruto</th>
                <th scope="col" className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Vencimento</th>
                <th scope="col" className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">Quitação</th>
                {isWriteAllowed && <th scope="col" className="px-6 py-3.5 text-right text-xs font-bold uppercase tracking-wider">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-transparent text-sm">
              {filteredPayments.length > 0 ? (
                filteredPayments.map((p) => {
                  const prof = professorsMap.get(p.professorId);
                  const linkedClass = p.classSessionId ? classesMap.get(p.classSessionId) : null;
                  return (
                    <tr key={p.id} className="glass-table-row transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white">{p.description}</div>
                        {linkedClass ? (
                          <div className="text-xs text-indigo-400 font-semibold mt-0.5">
                            Aula: {linkedClass.title}
                          </div>
                        ) : (
                          <div className="text-xs text-indigo-200/50 mt-0.5">Sem aula registrada</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-200">
                          {prof ? prof.name : 'Credor Desconhecido'}
                        </div>
                        <div className="text-xs text-indigo-200/50">{prof?.email || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-white font-mono">
                        {formatCSVCurrency(p.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-350 font-medium">
                        {formatCSVDate(p.dueDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {p.calculatedStatus === 'pago' && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold glass-badge-green">
                            Pago
                          </span>
                        )}
                        {p.calculatedStatus === 'pendente' && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold glass-badge-amber">
                            Pendente
                          </span>
                        )}
                        {p.calculatedStatus === 'atrasado' && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-extrabold glass-badge-red animate-pulse">
                            Atrasado
                          </span>
                        )}
                        {p.calculatedStatus === 'cancelado' && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold glass-badge-red opacity-65">
                            Cancelado
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {p.status === 'pago' ? (
                          <div className="text-xs">
                            <span className="font-semibold text-slate-200">{formatCSVDate(p.paymentDate!)}</span>
                            <span className="text-indigo-200/50 block">via {p.paymentMethod}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs">Pendente</span>
                        )}
                      </td>
                      {isWriteAllowed && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                          <div className="flex justify-end items-center space-x-1.5">
                            {p.calculatedStatus !== 'pago' && p.calculatedStatus !== 'cancelado' && (
                              <button
                                title="Marcar como Quitado/Pago"
                                onClick={() => handleOpenSettle(p.id)}
                                className="p-1 px-3.5 h-8 bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 rounded-md hover:bg-emerald-500/25 flex items-center gap-1 font-bold cursor-pointer transition-all"
                              >
                                <CheckSquare className="w-3.5 h-3.5" />
                                Quitar
                              </button>
                            )}

                            {p.calculatedStatus !== 'cancelado' && (
                              <button
                                title="Cancelar Lançamento"
                                onClick={() => handleCancelPayment(p.id)}
                                className="p-1 px-3 h-8 text-rose-300 hover:text-rose-100 bg-red-500/10 border border-red-500/10 hover:bg-red-500/20 rounded-md transition-all cursor-pointer"
                              >
                                Cancelar
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    Nenhum pagamento programado corresponde aos filtros do período atual.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settle Instant Modal Popup Form */}
      {settlingPaymentId && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-modal rounded-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="bg-black/25 text-white px-5 py-3 flex items-center justify-between border-b border-white/10">
              <h3 className="font-extrabold text-white text-base">Quitar Lançamento</h3>
              <button onClick={() => setSettlingPaymentId(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSettleConfirm} className="p-5 space-y-4">
              <div>
                <label htmlFor="settle-form-date" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Data do Pagamento <span className="text-rose-450">*</span>
                </label>
                <input
                  id="settle-form-date"
                  type="date"
                  required
                  value={settleDate}
                  onChange={(e) => setSettleDate(e.target.value)}
                  className="w-full px-4 py-2.5 glass-input rounded-xl text-sm"
                />
              </div>

              <div>
                <label htmlFor="settle-form-method" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Método utilizado <span className="text-rose-450">*</span>
                </label>
                <select
                  id="settle-form-method"
                  value={settleMethod}
                  onChange={(e) => setSettleMethod(e.target.value)}
                  className="w-full px-4 py-2.5 glass-input rounded-xl text-sm"
                >
                  <option value="Pix">Pix</option>
                  <option value="Transferência Bancária">Transferência Bancária</option>
                  <option value="Boleto">Boleto Bancário</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Cartão">Cartão de Crédito/Débito</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setSettlingPaymentId(null)}
                  className="px-4 py-2 bg-white/5 border border-white/10 text-slate-200 rounded-xl text-xs font-semibold hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  id="btn-confirm-settlement"
                  type="submit"
                  className="px-4 py-2 glass-button-primary text-xs rounded-xl hover:opacity-90 font-semibold cursor-pointer"
                >
                  Confirmar Quitação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-modal rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="bg-black/25 text-white px-6 py-4 flex items-center justify-between border-b border-white/10">
              <h3 className="font-extrabold text-white text-base">Registrar Lançamento Financeiro</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {creationError && (
                <div className="bg-red-500/15 border-l-4 border-red-500 p-2.5 rounded-r text-sm text-red-205 font-medium mb-3">
                  {creationError}
                </div>
              )}

              <div className="space-y-4.5 text-slate-200">
                <div>
                  <label htmlFor="pay-form-desc" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Descrição do Lançamento <span className="text-rose-450">*</span>
                  </label>
                  <input
                    id="pay-form-desc"
                    type="text"
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ex: Honorário de Aulas - Junho/2026"
                    className="w-full px-4 py-2.5 glass-input rounded-xl text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="pay-form-prof" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Credor (Professor) <span className="text-rose-450">*</span>
                    </label>
                    <select
                      id="pay-form-prof"
                      required
                      value={formData.professorId}
                      onChange={(e) => setFormData({ ...formData, professorId: e.target.value, classSessionId: '' })}
                      className="w-full px-4 py-2.5 glass-input rounded-xl text-sm"
                    >
                      <option value="">Selecione...</option>
                      {activeProfessors.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="pay-form-class" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Aula Associada (Opcional)
                    </label>
                    <select
                      id="pay-form-class"
                      value={formData.classSessionId}
                      disabled={!formData.professorId}
                      onChange={(e) => setFormData({ ...formData, classSessionId: e.target.value })}
                      className="w-full px-4 py-2.5 glass-input rounded-xl text-sm disabled:opacity-40"
                    >
                      <option value="">Nenhuma aula associada</option>
                      {classOptionsForSelectedProfessor.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="pay-form-amount" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Valor Bruto (R$) <span className="text-rose-450">*</span>
                    </label>
                    <input
                      id="pay-form-amount"
                      type="number"
                      step="0.01"
                      required
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="Ex: 1250.00"
                      className="w-full px-4 py-2.5 glass-input rounded-xl text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="pay-form-dueDate" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Vencimento <span className="text-rose-450">*</span>
                    </label>
                    <input
                      id="pay-form-dueDate"
                      type="date"
                      required
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full px-4 py-2.5 glass-input rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="pay-form-obs" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Anotações Internas
                  </label>
                  <textarea
                    id="pay-form-obs"
                    value={formData.observations}
                    onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                    rows={2}
                    placeholder="Informações contratuais relevantes."
                    className="w-full px-4 py-2.5 glass-input rounded-xl text-sm resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-white/5 border border-white/10 text-slate-200 rounded-xl text-sm font-semibold hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  id="btn-save-payment"
                  type="submit"
                  className="px-5 py-2 glass-button-primary rounded-xl text-sm font-semibold text-white transition-all cursor-pointer"
                >
                  Criar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
