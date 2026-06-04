import React, { useState, useMemo } from 'react';
import { useProfessores } from '@/hooks/useProfessores';
import { useAuth } from '@/auth/useAuth';
import { ProfessorForm } from './ProfessorForm';
import { ExportButton } from '@/components/shared/ExportButton';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit2, Ban, CheckCircle2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Database } from '@/types/database';

type Professor = Database['public']['Tables']['professores']['Row'];

export default function ProfessoresPage() {
  const { professores, loading, error, create, update, toggleAtivo } = useProfessores();
  const { role } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativos' | 'inativos'>('todos');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null);

  const canWrite = role === 'admin' || role === 'editor';

  const filteredProfessores = useMemo(() => {
    return professores.filter(p => {
      const matchName = p.nome.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = 
        statusFilter === 'todos' ? true : 
        statusFilter === 'ativos' ? p.ativo === true : 
        p.ativo === false;
      return matchName && matchStatus;
    });
  }, [professores, searchTerm, statusFilter]);

  const handleOpenCreate = () => {
    setEditingProfessor(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (professor: Professor) => {
    setEditingProfessor(professor);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: any) => {
    if (editingProfessor) {
      await update(editingProfessor.id, data);
    } else {
      await create(data);
    }
  };

  const handleToggleStatus = async (professor: Professor) => {
    if (confirm(`Deseja realmente ${professor.ativo ? 'desativar' : 'ativar'} o professor ${professor.nome}?`)) {
      try {
        await toggleAtivo(professor.id, professor.ativo);
      } catch (err: any) {
        alert(`Erro ao alterar status: ${err.message}`);
      }
    }
  };

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
          <h1 className="text-3xl font-bold text-slate-100">Professores</h1>
          <p className="text-slate-400 mt-1">Gerencie o cadastro de professores do sistema.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <ExportButton 
            data={filteredProfessores} 
            filename="professores" 
            className="w-full sm:w-auto border-slate-700 text-slate-300 hover:bg-slate-800"
          />
          {canWrite && (
            <Button onClick={handleOpenCreate} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Novo Professor
            </Button>
          )}
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
          <option value="inativos">Apenas Inativos</option>
        </select>
      </div>

      <div className="rounded-md border border-slate-800 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-900/80">
            <TableRow className="border-slate-800 hover:bg-slate-900/80">
              <TableHead className="text-slate-400">Nome</TableHead>
              <TableHead className="text-slate-400">Contato</TableHead>
              <TableHead className="text-slate-400 hidden sm:table-cell">Especialidade</TableHead>
              <TableHead className="text-slate-400">Status</TableHead>
              {canWrite && <TableHead className="text-slate-400 text-right">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody className="bg-slate-950">
            {filteredProfessores.length === 0 ? (
              <TableRow className="border-slate-800 hover:bg-slate-900/50">
                <TableCell colSpan={canWrite ? 5 : 4} className="h-24 text-center text-slate-500">
                  Nenhum professor encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredProfessores.map((professor) => (
                <TableRow key={professor.id} className="border-slate-800 hover:bg-slate-900/50">
                  <TableCell className="font-medium text-slate-200">
                    {professor.nome}
                  </TableCell>
                  <TableCell className="text-slate-400">
                    <div className="flex flex-col gap-1 text-xs">
                      {professor.email && <span>{professor.email}</span>}
                      {professor.telefone && <span>{professor.telefone}</span>}
                      {!professor.email && !professor.telefone && <span className="text-slate-600">-</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-400 hidden sm:table-cell">
                    {professor.especialidade || '-'}
                  </TableCell>
                  <TableCell>
                    <StatusBadge ativo={professor.ativo} />
                  </TableCell>
                  {canWrite && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleOpenEdit(professor)}
                          className="text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleToggleStatus(professor)}
                          className={professor.ativo 
                            ? "text-slate-400 hover:text-red-400 hover:bg-red-400/10" 
                            : "text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10"
                          }
                          title={professor.ativo ? "Desativar" : "Reativar"}
                        >
                          {professor.ativo ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ProfessorForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        professor={editingProfessor}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
