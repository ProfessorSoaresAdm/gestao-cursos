import React, { useState, useMemo } from 'react';
import { usePagamentos } from '@/hooks/usePagamentos';
import { useProfessores } from '@/hooks/useProfessores';
import { useAuth } from '@/auth/useAuth';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PagamentoForm } from './PagamentoForm';
import { ExportButton } from '@/components/shared/ExportButton';
import { ImportModal } from '@/components/shared/ImportModal';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit2, Ban, CheckCircle2, DollarSign, Upload } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import type { PagamentoWithRelations } from './pagamentoService';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export default function PagamentosPage() {
  const { pagamentos, loading: pagamentosLoading, error, create, update, cancelar, marcarPago, insertMany } = usePagamentos();
  const { professores, loading: profLoading } = useProfessores();
  const { role } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendente' | 'pago' | 'atrasado' | 'cancelado'>('todos');
  const [mesFilter, setMesFilter] = useState<string>(''); // YYYY-MM
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingPagamento, setEditingPagamento] = useState<PagamentoWithRelations | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => Promise<void>;
  }>({
    isOpen: false, title: '', description: '', action: async () => {}
  });

  // Modal rápido de pagamento
  const [quickPayOpen, setQuickPayOpen] = useState(false);
  const [quickPayId, setQuickPayId] = useState<string | null>(null);
  const [quickPayData, setQuickPayData] = useState({ data: format(new Date(), 'yyyy-MM-dd'), metodo: 'pix' });

  const canWrite = role === 'admin' || role === 'editor';
  const loading = pagamentosLoading || profLoading;

  const filteredPagamentos = useMemo(() => {
    return pagamentos.filter(p => {
      const matchDesc = p.descricao.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'todos' || p.status === statusFilter;
      
      let matchMes = true;
      if (mesFilter && p.data_vencimento) {
        const [pYear, pMonth] = p.data_vencimento.split('-');
        const [year, month] = mesFilter.split('-');
        matchMes = pYear === year && pMonth === month;
      }

      return matchDesc && matchStatus && matchMes;
    });
  }, [pagamentos, searchTerm, statusFilter, mesFilter]);

  // Resumo de Cards
  const totais = useMemo(() => {
    return filteredPagamentos.reduce(
      (acc, curr) => {
        if (curr.status === 'pago') acc.pago += curr.valor;
        if (curr.status === 'pendente') acc.pendente += curr.valor;
        if (curr.status === 'atrasado') acc.atrasado += curr.valor;
        return acc;
      },
      { pago: 0, pendente: 0, atrasado: 0 }
    );
  }, [filteredPagamentos]);

  const handleOpenCreate = () => {
    setEditingPagamento(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (pagamento: PagamentoWithRelations) => {
    setEditingPagamento(pagamento);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: any) => {
    if (editingPagamento) {
      await update(editingPagamento.id, data);
    } else {
      await create(data);
    }
  };

  const handleOpenQuickPay = (id: string) => {
    setQuickPayId(id);
    setQuickPayData({ data: format(new Date(), 'yyyy-MM-dd'), metodo: 'pix' });
    setQuickPayOpen(true);
  };

  const confirmQuickPay = async () => {
    if (quickPayId) {
      try {
        await marcarPago(quickPayId, quickPayData.data, quickPayData.metodo);
        toast.success('Pagamento baixado com sucesso!');
        setQuickPayOpen(false);
        setQuickPayId(null);
      } catch (err: any) {
        toast.error(`Erro ao marcar pagamento: ${err.message}`);
      }
    }
  };

  const handleQuickStatus = async (pagamento: PagamentoWithRelations, novoStatus: 'pago' | 'cancelado') => {
    setConfirmDialog({
      isOpen: true,
      title: 'Cancelar Pagamento',
      description: 'Tem certeza que deseja cancelar este registro de pagamento? A ação poderá ser revertida alterando o status novamente.',
      action: async () => {
        try {
          await cancelar(pagamento.id);
          toast.success('Pagamento cancelado com sucesso.');
        } catch (err: any) {
          toast.error(`Erro ao cancelar pagamento: ${err.message}`);
        }
      }
    });
  };

  const handleImport = async (data: any[]) => {
    try {
      const inserts = data.map(row => {
        let professor_id = null;
        if (row['Nome do Professor']) {
          const prof = professores.find(p => p.nome.toLowerCase() === String(row['Nome do Professor']).trim().toLowerCase());
          if (!prof) {
            throw new Error(`Professor não encontrado: "${row['Nome do Professor']}". Certifique-se de que o nome está idêntico ao cadastrado.`);
          }
          professor_id = prof.id;
        }

        let valor = 0;
        if (row['Valor']) {
          const parsed = parseFloat(String(row['Valor']).replace(/[^0-9.-]+/g, ""));
          if (!isNaN(parsed)) valor = parsed;
        }

        const vencStr = row['Vencimento'];
        if (!vencStr) throw new Error("A coluna 'Vencimento' é obrigatória (formato YYYY-MM-DD).");
        
        let dataVenc = vencStr;
        try {
          dataVenc = new Date(vencStr).toISOString().split('T')[0];
        } catch(e) {
          throw new Error(`Data inválida: "${vencStr}". Use o formato AAAA-MM-DD (ex: 2026-12-01)`);
        }
        
        return {
          professor_id,
          descricao: row['Descricao'] || 'Pagamento importado',
          valor,
          data_vencimento: dataVenc,
          status: row['Status'] === 'pago' ? 'pago' : row['Status'] === 'cancelado' ? 'cancelado' : 'pendente',
          metodo: row['Metodo'] || null
        };
      });

      if (inserts.length === 0) throw new Error("Nenhum dado válido encontrado.");
      
      await insertMany(inserts);
      toast.success(`${inserts.length} pagamentos importados com sucesso!`);
    } catch(err:any) {
      throw new Error(err.message);
    }
  };

  const exportColumns = [
    { key: 'descricao', label: 'Descrição' },
    { key: 'professores.nome', label: 'Professor', format: (val: any) => val || 'Geral' },
    { key: 'valor', label: 'Valor', format: (val: any) => formatCurrency(val) },
    { key: 'data_vencimento', label: 'Vencimento', format: (val: any) => val ? format(parseISO(val), 'dd/MM/yyyy') : '' },
    { key: 'data_pagamento', label: 'Pagamento', format: (val: any) => val ? format(parseISO(val), 'dd/MM/yyyy') : '' },
    { key: 'status', label: 'Status' },
    { key: 'metodo', label: 'Método', format: (val: any) => val || '' }
  ];

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-500">
        <h2 className="text-xl font-bold mb-2">Erro ao carregar dados</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Pagamentos</h1>
          <p className="text-slate-400 mt-1">Controle financeiro, recebimentos e inadimplências.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <ExportButton 
              data={filteredPagamentos}
              filename="pagamentos"
              columns={exportColumns}
              className="w-full sm:w-auto border-slate-700 text-slate-300 hover:bg-slate-800"
            />
            {canWrite && (
              <>
                <Button onClick={() => setIsImportOpen(true)} className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-200">
                  <Upload className="w-4 h-4 mr-2" />
                  Importar
                </Button>
                <Button onClick={handleOpenCreate} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Pagamento
                </Button>
              </>
            )}
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-emerald-950/30 border border-emerald-900/50 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-emerald-400 text-sm font-medium">Total Pago</p>
            <p className="text-2xl font-bold text-emerald-50 mt-1">{formatCurrency(totais.pago)}</p>
          </div>
          <div className="bg-emerald-900/50 p-3 rounded-full">
            <DollarSign className="w-6 h-6 text-emerald-400" />
          </div>
        </div>
        <div className="bg-amber-950/30 border border-amber-900/50 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-amber-400 text-sm font-medium">Pendente (A Vencer)</p>
            <p className="text-2xl font-bold text-amber-50 mt-1">{formatCurrency(totais.pendente)}</p>
          </div>
          <div className="bg-amber-900/50 p-3 rounded-full">
            <DollarSign className="w-6 h-6 text-amber-400" />
          </div>
        </div>
        <div className="bg-red-950/30 border border-red-900/50 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-red-400 text-sm font-medium">Em Atraso</p>
            <p className="text-2xl font-bold text-red-50 mt-1">{formatCurrency(totais.atrasado)}</p>
          </div>
          <div className="bg-red-900/50 p-3 rounded-full">
            <DollarSign className="w-6 h-6 text-red-400" />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-slate-900/50 p-4 rounded-lg border border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder="Buscar por descrição..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-slate-950 border-slate-800 text-slate-200"
          />
        </div>

        <Input 
          type="month"
          value={mesFilter}
          onChange={(e) => setMesFilter(e.target.value)}
          className="bg-slate-950 border-slate-800 text-slate-200 w-full md:w-48"
        />

        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="h-10 px-3 py-2 rounded-md bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-48"
        >
          <option value="todos">Todos os Status</option>
          <option value="pago">Pagos</option>
          <option value="pendente">Pendentes</option>
          <option value="atrasado">Atrasados</option>
          <option value="cancelado">Cancelados</option>
        </select>
      </div>

      <div className="rounded-md border border-slate-800 overflow-hidden overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-900/80">
            <TableRow className="border-slate-800 hover:bg-slate-900/80">
              <TableHead className="text-slate-400">Descrição / Professor</TableHead>
              <TableHead className="text-slate-400 text-right">Valor</TableHead>
              <TableHead className="text-slate-400">Vencimento</TableHead>
              <TableHead className="text-slate-400">Status</TableHead>
              {canWrite && <TableHead className="text-slate-400 text-right">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody className="bg-slate-950">
            {filteredPagamentos.length === 0 ? (
              <TableRow className="border-slate-800 hover:bg-slate-900/50">
                <TableCell colSpan={canWrite ? 5 : 4} className="h-24 text-center text-slate-500">
                  Nenhum registro encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredPagamentos.map((pagamento) => (
                <TableRow key={pagamento.id} className="border-slate-800 hover:bg-slate-900/50">
                  <TableCell>
                    <div className="font-medium text-slate-200">{pagamento.descricao}</div>
                    <div className="text-xs text-slate-400 mt-1">
                      {pagamento.professores?.nome ? `Prof. ${pagamento.professores.nome}` : 'Geral'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-slate-200 font-medium">
                    {formatCurrency(pagamento.valor)}
                  </TableCell>
                  <TableCell className="text-slate-300 text-sm">
                    {pagamento.data_vencimento ? format(parseISO(pagamento.data_vencimento), "dd/MM/yyyy") : '-'}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={pagamento.status} />
                  </TableCell>
                  {canWrite && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(pagamento.status === 'pendente' || pagamento.status === 'atrasado') && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleOpenQuickPay(pagamento.id)}
                            className="text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10"
                            title="Marcar como Pago"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleOpenEdit(pagamento)}
                          className="text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        {pagamento.status !== 'cancelado' && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleQuickStatus(pagamento, 'cancelado')}
                            className="text-slate-400 hover:text-red-400 hover:bg-red-400/10"
                            title="Cancelar"
                          >
                            <Ban className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={confirmDialog.isOpen} onOpenChange={(isOpen) => !isOpen && setConfirmDialog(prev => ({ ...prev, isOpen: false }))}>
        <AlertDialogContent className="bg-slate-900 border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-100">{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              {confirmDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { confirmDialog.action(); setConfirmDialog(prev => ({...prev, isOpen: false})); }} className="bg-red-600 hover:bg-red-700">
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Importar Pagamentos"
        instructions={[
          "Salve sua planilha Excel como formato CSV (UTF-8).",
          "A coluna 'Nome do Professor' deve ter o nome EXATAMENTE igual ao cadastrado no sistema (pode deixar vazio para contas gerais).",
          "A coluna 'Vencimento' é obrigatória (ex: 2026-12-01).",
          "Valor deve ser numérico (ex: 1500.50).",
          "Status aceitos: pendente, pago, cancelado."
        ]}
        expectedColumns={['Nome do Professor', 'Descricao', 'Valor', 'Vencimento', 'Status', 'Metodo']}
        onImport={handleImport}
      />
      
      <PagamentoForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        pagamento={editingPagamento}
        onSubmit={handleFormSubmit}
      />

      {/* Mini-Modal: Marcar como Pago */}
      <Dialog open={quickPayOpen} onOpenChange={setQuickPayOpen}>
        <DialogContent className="sm:max-w-[400px] bg-slate-950 text-slate-100 border-slate-800">
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="qp_data">Data do Pagamento</Label>
              <Input 
                id="qp_data" 
                type="date" 
                value={quickPayData.data}
                onChange={e => setQuickPayData(p => ({ ...p, data: e.target.value }))}
                className="bg-slate-900 border-slate-800 text-slate-200" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qp_metodo">Método</Label>
              <select 
                id="qp_metodo" 
                value={quickPayData.metodo}
                onChange={e => setQuickPayData(p => ({ ...p, metodo: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200"
              >
                <option value="pix">PIX</option>
                <option value="transferencia">Transferência</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao">Cartão</option>
                <option value="outro">Outro</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setQuickPayOpen(false)} className="hover:bg-slate-800 text-slate-300">
              Cancelar
            </Button>
            <Button onClick={confirmQuickPay} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Confirmar Recebimento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
