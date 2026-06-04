import { useState, useCallback, useEffect } from 'react';
import { pessoalService } from '@/modules/pessoal/pessoalService';
import type { Database } from '@/types/database';

type PessoalRow = Database['public']['Tables']['pessoal']['Row'];
type PessoalInsert = Database['public']['Tables']['pessoal']['Insert'];
type PessoalUpdate = Database['public']['Tables']['pessoal']['Update'];

export function usePessoal() {
  const [pessoal, setPessoal] = useState<PessoalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await pessoalService.getAll();
      setPessoal(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const create = async (data: Omit<PessoalInsert, 'id' | 'criado_em' | 'atualizado_em'>) => {
    try {
      setError(null);
      await pessoalService.create(data);
      await fetchAll();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const update = async (id: string, data: Partial<PessoalUpdate>) => {
    try {
      setError(null);
      await pessoalService.update(id, data);
      await fetchAll();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      setError(null);
      await pessoalService.updateStatus(id, status);
      await fetchAll();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    pessoal,
    loading,
    error,
    fetchAll,
    create,
    update,
    updateStatus,
  };
}
