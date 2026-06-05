import React, { useState } from 'react';
import { useUsuarios, Usuario, CreateUsuarioData } from '@/hooks/useUsuarios';
import { useAuth } from '@/auth/useAuth';
import { ShieldAlert, Shield, ShieldCheck, UserCog, Power, Plus, Edit } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const TELAS_DISPONIVEIS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'aulas', label: 'Aulas' },
  { id: 'pagamentos', label: 'Pagamentos' },
  { id: 'professores', label: 'Professores' },
  { id: 'pessoal', label: 'Pessoal' },
  { id: 'usuarios', label: 'Usuários' },
  { id: 'backup', label: 'Backups' },
  { id: 'relatorios', label: 'Relatórios' },
];

export default function UsuariosPage() {
  const { usuarios, loading: usuariosLoading, updateRole, toggleAtivo, adminCreateUser, updateUsuario } = useUsuarios();
  const { role: currentUserRole, loading: authLoading } = useAuth();
  
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    action: async () => {},
  });

  const [formDialog, setFormDialog] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    usuario?: Usuario;
  }>({
    isOpen: false,
    mode: 'create'
  });

  const [formData, setFormData] = useState<Partial<CreateUsuarioData>>({
    nome: '',
    email: '',
    password: '',
    role: 'viewer',
    telas_acesso: ['dashboard', 'aulas', 'pagamentos', 'professores']
  });

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (authLoading || usuariosLoading) {
    return (
      <div className="p-6 flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (currentUserRole !== 'admin') {
    return (
      <div className="p-6 max-w-3xl mx-auto mt-10">
        <div className="bg-red-950/30 border border-red-900/50 p-8 rounded-xl flex flex-col items-center justify-center text-center">
          <div className="bg-red-900/50 p-4 rounded-full mb-4">
            <ShieldAlert className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mb-2">Acesso Negado</h1>
          <p className="text-slate-400">
            A gestão de usuários é estritamente confidencial e limitada a Administradores do Sistema.
          </p>
        </div>
      </div>
    );
  }

  const handleOpenCreate = () => {
    setFormData({
      nome: '',
      email: '',
      password: '',
      role: 'viewer',
      telas_acesso: ['dashboard', 'aulas', 'pagamentos', 'professores']
    });
    setFormDialog({ isOpen: true, mode: 'create' });
  };

  const handleOpenEdit = (usuario: Usuario) => {
    setFormData({
      nome: usuario.nome,
      email: usuario.email, // read-only on edit in form UI
      role: usuario.role,
      telas_acesso: usuario.telas_acesso || []
    });
    setFormDialog({ isOpen: true, mode: 'edit', usuario });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (formDialog.mode === 'create') {
        if (!formData.email || !formData.password || !formData.nome) {
          toast.error('Preencha todos os campos obrigatórios.');
          return;
        }
        await adminCreateUser(formData as CreateUsuarioData);
        toast.success('Usuário criado com sucesso!');
      } else if (formDialog.mode === 'edit' && formDialog.usuario) {
        await updateUsuario(formDialog.usuario.id, {
          nome: formData.nome,
          role: formData.role,
          telas_acesso: formData.telas_acesso
        });
        toast.success('Usuário atualizado com sucesso!');
      }
      setFormDialog({ isOpen: false, mode: 'create' });
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar usuário');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleTela = (telaId: string) => {
    setFormData(prev => {
      const telas = prev.telas_acesso || [];
      if (telas.includes(telaId)) {
        return { ...prev, telas_acesso: telas.filter(t => t !== telaId) };
      } else {
        return { ...prev, telas_acesso: [...telas, telaId] };
      }
    });
  };

  const handleToggleStatus = async (usuario: Usuario) => {
    const isActivating = !usuario.ativo;
    const actionText = isActivating ? 'ativar' : 'bloquear';
    
    setConfirmDialog({
      isOpen: true,
      title: isActivating ? 'Reativar Usuário' : 'Bloquear Acesso',
      description: `Tem certeza que deseja ${actionText} o acesso de ${usuario.nome} ao sistema?`,
      action: async () => {
        try {
          setProcessingId(usuario.id);
          await toggleAtivo(usuario.id, isActivating);
          toast.success(`Acesso de ${usuario.nome} foi ${isActivating ? 'reativado' : 'bloqueado'}.`);
        } catch (err: any) {
          toast.error(`Falha ao ${actionText} usuário: ` + err.message);
        } finally {
          setProcessingId(null);
        }
      }
    });
  };

  const RoleIcon = ({ role }: { role: string }) => {
    if (role === 'admin') return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
    if (role === 'editor') return <UserCog className="w-4 h-4 text-indigo-400" />;
    return <Shield className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
            Gestão de Acessos <ShieldAlert className="w-5 h-5 text-red-400" aria-label="Área Restrita" />
          </h1>
          <p className="text-slate-400 mt-1">Gerencie usuários, níveis de acesso e permissões de telas.</p>
        </div>
        <Button onClick={handleOpenCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      <div className="rounded-md border border-slate-800 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-900/80">
            <TableRow className="border-slate-800 hover:bg-slate-900/80">
              <TableHead className="text-slate-400">Usuário</TableHead>
              <TableHead className="text-slate-400">Nível de Acesso</TableHead>
              <TableHead className="text-slate-400 hidden md:table-cell">Permissões (Telas)</TableHead>
              <TableHead className="text-slate-400">Status</TableHead>
              <TableHead className="text-slate-400 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-slate-950">
            {usuarios.length === 0 ? (
              <TableRow className="border-slate-800">
                <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            ) : (
              usuarios.map((usuario) => (
                <TableRow key={usuario.id} className={`border-slate-800 ${!usuario.ativo ? 'opacity-50' : ''}`}>
                  <TableCell>
                    <div className="font-medium text-slate-200">{usuario.nome}</div>
                    <div className="text-xs text-slate-400 mt-1">{usuario.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <RoleIcon role={usuario.role} />
                      <span className="text-slate-200 text-sm capitalize">{usuario.role}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex flex-wrap gap-1 max-w-[250px]">
                      {usuario.role === 'admin' ? (
                        <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">Acesso Total</span>
                      ) : (
                        usuario.telas_acesso?.length ? usuario.telas_acesso.map(tela => (
                          <span key={tela} className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                            {tela}
                          </span>
                        )) : <span className="text-xs text-slate-500">Nenhuma tela</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      usuario.ativo ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {usuario.ativo ? 'Ativo' : 'Bloqueado'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleOpenEdit(usuario)}
                        disabled={processingId === usuario.id || !usuario.ativo}
                        className="text-slate-300 hover:text-white hover:bg-slate-800"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleToggleStatus(usuario)}
                        disabled={processingId === usuario.id}
                        className={usuario.ativo ? "text-red-400 hover:text-red-300 hover:bg-red-400/10" : "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10"}
                      >
                        <Power className="w-4 h-4 mr-2" />
                        {usuario.ativo ? 'Bloquear' : 'Reativar'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Form Dialog para Create/Edit */}
      <Dialog open={formDialog.isOpen} onOpenChange={(isOpen) => !isOpen && setFormDialog(prev => ({ ...prev, isOpen: false }))}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {formDialog.mode === 'create' ? 'Novo Usuário' : 'Editar Usuário'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Nome Completo</Label>
              <Input 
                required 
                value={formData.nome} 
                onChange={e => setFormData({...formData, nome: e.target.value})}
                className="bg-slate-950 border-slate-700 text-white"
                placeholder="Ex: João Silva"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-300">E-mail</Label>
              <Input 
                required={formDialog.mode === 'create'}
                type="email" 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="bg-slate-950 border-slate-700 text-white disabled:opacity-50"
                placeholder="joao@exemplo.com"
                disabled={formDialog.mode === 'edit'}
              />
            </div>

            {formDialog.mode === 'create' && (
              <div className="space-y-2">
                <Label className="text-slate-300">Senha</Label>
                <Input 
                  required 
                  type="password"
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="bg-slate-950 border-slate-700 text-white"
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-slate-300">Nível de Acesso (Role)</Label>
              <select 
                value={formData.role} 
                onChange={e => setFormData({...formData, role: e.target.value as any})}
                className="w-full flex h-10 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="admin">Administrador (Acesso Total)</option>
                <option value="editor">Editor (Pode alterar dados)</option>
                <option value="viewer">Visualizador (Apenas leitura)</option>
              </select>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-800">
              <Label className="text-slate-300 font-semibold">Telas Permitidas</Label>
              {formData.role === 'admin' ? (
                <div className="text-sm text-indigo-400 bg-indigo-500/10 p-3 rounded-md border border-indigo-500/20">
                  Administradores têm acesso automático a todas as telas do sistema. O controle granular não se aplica.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {TELAS_DISPONIVEIS.map(tela => (
                    <label key={tela.id} className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox"
                        checked={formData.telas_acesso?.includes(tela.id)}
                        onChange={() => handleToggleTela(tela.id)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-slate-900"
                      />
                      <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{tela.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-800 mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setFormDialog({ isOpen: false, mode: 'create' })}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {isSubmitting ? 'Salvando...' : 'Salvar Usuário'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDialog.isOpen} onOpenChange={(isOpen) => !isOpen && setConfirmDialog(prev => ({ ...prev, isOpen: false }))}>
        <AlertDialogContent className="bg-slate-900 border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-100">{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              {confirmDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                confirmDialog.action();
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
              }}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
