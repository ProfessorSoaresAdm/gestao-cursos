import React, { useState, useMemo } from 'react';
import { usePessoal } from '@/hooks/usePessoal';
import { useAuth } from '@/auth/useAuth';
import { format, parseISO } from 'date-fns';
import { PessoalForm } from './PessoalForm';
import { ExportButton } from '@/components/shared/ExportButton';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit2, ShieldAlert } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Database } from '@/types/database';

type PessoalRow = Database['public']['Tables']['pessoal']['Row'];

const safeFormatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  try {
    return format(d, 'dd/MM/yyyy');
  } catch (e) {
    return '';
  }
};

export default function PessoalPage() {
  const { pessoal, loading: pessoalLoading, error, create, update } = usePessoal();
  const { role, loading: authLoading } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativos' | 'inativos'>('todos');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFuncionario, setEditingFuncionario] = useState<PessoalRow | null>(null);

  const filteredPessoal = useMemo(() => {
    return pessoal.filter(p => {
      const matchNome = (p.nome || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = 
        statusFilter === 'todos' ? true : 
        statusFilter === 'ativos' ? p.status === 'ativo' : 
        p.status === 'inativo';
      
      return matchNome && matchStatus;
    });
  }, [pessoal, searchTerm, statusFilter]);

  const handleOpenCreate = () => {
    setEditingFuncionario(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (funcionario: PessoalRow) => {
    setEditingFuncionario(funcionario);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: any) => {
    if (editingFuncionario) {
      await update(editingFuncionario.id, data);
    } else {
      await create(data);
    }
  };

  // Prepara dados para o ExportButton, OMITINDO explicitamente o salário
  const exportData = filteredPessoal.map(p => ({
    Nome: p.nome,
    Cargo: p.cargo || '',
    Email: p.email || '',
    Telefone: p.telefone || '',
    Documento: p.documento || '',
    DataAdmissao: safeFormatDate(p.data_admissao),
    DataDemissao: safeFormatDate(p.data_demissao),
    Status: p.status === 'ativo' ? 'Ativo' : 'Desligado',
    Observacoes: p.observacoes || ''
    // Salário propositalmente omitido do CSV por segurança
  }));

  if (authLoading) {
    return (
      <div className="p-6 flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  // Verificação dupla de segurança
  if (role !== 'admin') {
    return (
      <div className="p-6 max-w-3xl mx-auto mt-10">
        <div className="bg-red-950/30 border border-red-900/50 p-8 rounded-xl flex flex-col items-center justify-center text-center">
          <div className="bg-red-900/50 p-4 rounded-full mb-4">
            <ShieldAlert className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mb-2">Acesso Não Autorizado</h1>
          <p className="text-slate-400">
            A área de Gestão de Pessoal e RH é estritamente confidencial e limitada a Administradores.
          </p>
        </div>
      </div>
    );
  }



  if (pessoalLoading) {
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
          <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
            Gestão de Pessoal <ShieldAlert className="w-5 h-5 text-indigo-400" title="Área Restrita" />
          </h1>
          <p className="text-slate-400 mt-1">Cadastro e contratos da equipe operacional e administrativa.</p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <ExportButton 
            data={exportData} 
            filename="pessoal_rh" 
            className="w-full sm:w-auto border-slate-700 text-slate-300 hover:bg-slate-800"
          />
          <Button onClick={handleOpenCreate} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Novo Funcionário
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-slate-900/50 p-4 rounded-lg border border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder="Buscar por nome..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-slate-950 border-slate-800 text-slate-200"
          />
        </div>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="h-10 px-3 py-2 rounded-md bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="todos">Todos os Status</option>
          <option value="ativos">Apenas Ativos</option>
          <option value="inativos">Apenas Desligados</option>
        </select>
      </div>

      <div className="rounded-md border border-slate-800 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-900/80">
            <TableRow className="border-slate-800 hover:bg-slate-900/80">
              <TableHead className="text-slate-400">Funcionário</TableHead>
              <TableHead className="text-slate-400">Contato</TableHead>
              <TableHead className="text-slate-400">Admissão</TableHead>
              <TableHead className="text-slate-400">Status</TableHead>
              <TableHead className="text-slate-400 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-slate-950">
            {filteredPessoal.length === 0 ? (
              <TableRow className="border-slate-800 hover:bg-slate-900/50">
                <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                  Nenhum funcionário encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredPessoal.map((funcionario) => (
                <TableRow key={funcionario.id} className="border-slate-800 hover:bg-slate-900/50">
                  <TableCell>
                    <div className="font-medium text-slate-200">{funcionario.nome}</div>
                    <div className="text-xs text-slate-400 mt-1">{funcionario.cargo || 'Sem cargo'}</div>
                  </TableCell>
                  <TableCell className="text-slate-400">
                    <div className="flex flex-col gap-1 text-xs">
                      {funcionario.email && <span>{funcionario.email}</span>}
                      {funcionario.telefone && <span>{funcionario.telefone}</span>}
                      {!funcionario.email && !funcionario.telefone && <span className="text-slate-600">-</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-300 text-sm">
                    {safeFormatDate(funcionario.data_admissao) || '-'}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={funcionario.status || 'ativo'} ativo={funcionario.status === 'ativo'} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleOpenEdit(funcionario)}
                      className="text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10"
                      title="Editar Confidencial"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PessoalForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        funcionario={editingFuncionario}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
