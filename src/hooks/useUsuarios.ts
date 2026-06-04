import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth/useAuth';
import { createClient } from '@supabase/supabase-js';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  telas_acesso: string[];
  ativo: boolean;
  criado_em: string;
}

export type CreateUsuarioData = Omit<Usuario, 'id' | 'criado_em' | 'ativo'> & { password?: string };

export function useUsuarios() {
  const { role } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsuarios = async () => {
    if (role !== 'admin') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('profiles')
        .select('*')
        .order('nome');

      if (err) throw err;
      // Tratar dados nulos em telas_acesso
      const usuariosFormatados = (data as any[]).map(u => ({
        ...u,
        telas_acesso: u.telas_acesso || []
      }));
      setUsuarios(usuariosFormatados);
      setError(null);
    } catch (err: any) {
      console.error('Erro ao buscar usuários:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, [role]);

  const updateRole = async (id: string, newRole: 'admin' | 'editor' | 'viewer') => {
    try {
      const { error: err } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', id);

      if (err) throw err;
      setUsuarios(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));
    } catch (err: any) {
      console.error('Erro ao atualizar role:', err);
      throw err;
    }
  };

  const toggleAtivo = async (id: string, ativo: boolean) => {
    try {
      const { error: err } = await supabase
        .from('profiles')
        .update({ ativo })
        .eq('id', id);

      if (err) throw err;
      setUsuarios(prev => prev.map(u => u.id === id ? { ...u, ativo } : u));
    } catch (err: any) {
      console.error('Erro ao atualizar status:', err);
      throw err;
    }
  };

  const adminCreateUser = async (data: CreateUsuarioData) => {
    if (!data.password) throw new Error('A senha é obrigatória para criar um novo usuário');
    
    // Instancia um cliente secundário para não deslogar o admin atual
    const adminClient = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    try {
      // 1. Cria o usuário no auth.users silenciosamente
      const { data: authData, error: authError } = await adminClient.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Falha ao criar usuário na autenticação');

      const userId = authData.user.id;

      // 2. Atualiza o profile recém-criado pela trigger (ou insere se não existir)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          nome: data.nome,
          role: data.role,
          telas_acesso: data.telas_acesso,
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // 3. Atualiza a listagem local
      await fetchUsuarios();
    } catch (err: any) {
      console.error('Erro ao criar usuário:', err);
      throw err;
    }
  };

  const updateUsuario = async (id: string, data: Partial<CreateUsuarioData>) => {
    try {
      const { error: err } = await supabase
        .from('profiles')
        .update({
          nome: data.nome,
          role: data.role,
          telas_acesso: data.telas_acesso,
        })
        .eq('id', id);

      if (err) throw err;
      
      setUsuarios(prev => prev.map(u => {
        if (u.id === id) {
          return {
            ...u,
            nome: data.nome ?? u.nome,
            role: data.role ?? u.role,
            telas_acesso: data.telas_acesso ?? u.telas_acesso,
          };
        }
        return u;
      }));
    } catch (err: any) {
      console.error('Erro ao atualizar usuário:', err);
      throw err;
    }
  };

  return {
    usuarios,
    loading,
    error,
    updateRole,
    toggleAtivo,
    adminCreateUser,
    updateUsuario,
    refresh: fetchUsuarios
  };
}
