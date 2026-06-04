import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth/useAuth';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  ativo: boolean;
  criado_em: string;
}

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
      setUsuarios(data as Usuario[]);
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

  return {
    usuarios,
    loading,
    error,
    updateRole,
    toggleAtivo,
    refresh: fetchUsuarios
  };
}
