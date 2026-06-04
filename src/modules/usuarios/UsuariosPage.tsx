import React, { useState } from 'react';
import { useUsuarios, Usuario } from '@/hooks/useUsuarios';
import { useAuth } from '@/auth/useAuth';
import { ShieldAlert, Shield, ShieldCheck, UserCog, Power } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
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

export default function UsuariosPage() {
  const { usuarios, loading: usuariosLoading, error, updateRole, toggleAtivo } = useUsuarios();
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

  const [processingId, setProcessingId] = useState<string | null>(null);

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

  const handleRoleChange = async (usuario: Usuario, newRole: 'admin' | 'editor' | 'viewer') => {
    if (usuario.role === newRole) return;
    
    setConfirmDialog({
      isOpen: true,
      title: 'Alterar Permissão',
      description: `Tem certeza que deseja alterar o nível de acesso de ${usuario.nome} para ${newRole.toUpperCase()}?`,
      action: async () => {
        try {
          setProcessingId(usuario.id);
          await updateRole(usuario.id, newRole);
          toast.success(`Permissão de ${usuario.nome} atualizada para ${newRole}.`);
        } catch (err: any) {
          toast.error('Falha ao alterar permissão: ' + err.message);
        } finally {
          setProcessingId(null);
        }
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
      <div>
        <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
          Gestão de Acessos <ShieldAlert className="w-5 h-5 text-red-400" title="Área Restrita" />
        </h1>
        <p className="text-slate-400 mt-1">Gerencie quem tem acesso ao sistema e suas permissões.</p>
      </div>

      <div className="rounded-md border border-slate-800 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-900/80">
            <TableRow className="border-slate-800 hover:bg-slate-900/80">
              <TableHead className="text-slate-400">Usuário</TableHead>
              <TableHead className="text-slate-400">Conta Criada</TableHead>
              <TableHead className="text-slate-400">Nível de Acesso (Role)</TableHead>
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
                  <TableCell className="text-slate-400 text-sm">
                    {format(new Date(usuario.criado_em), "dd 'de' MMM, yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <RoleIcon role={usuario.role} />
                      <select
                        disabled={processingId === usuario.id || !usuario.ativo}
                        value={usuario.role}
                        onChange={(e) => handleRoleChange(usuario, e.target.value as any)}
                        className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded px-2 py-1 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="admin">Administrador (Admin)</option>
                        <option value="editor">Moderador (Editor)</option>
                        <option value="viewer">Visualizador (Viewer)</option>
                      </select>
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
                  </TableCell>
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
