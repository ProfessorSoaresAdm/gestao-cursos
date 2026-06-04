import { useState, useCallback, useEffect } from 'react';
import { professorService } from '@/modules/professores/professorService';
import type { Database } from '@/types/database';

type Professor = Database['public']['Tables']['professores']['Row'];
type ProfessorInsert = Database['public']['Tables']['professores']['Insert'];
type ProfessorUpdate = Database['public']['Tables']['professores']['Update'];

export function useProfessores() {
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await professorService.getAll();
      setProfessores(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const create = async (data: Omit<ProfessorInsert, 'id' | 'criado_em' | 'atualizado_em'>) => {
    try {
      setError(null);
      await professorService.create(data);
      await fetchAll();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const update = async (id: string, data: Partial<ProfessorUpdate>) => {
    try {
      setError(null);
      await professorService.update(id, data);
      await fetchAll();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const toggleAtivo = async (id: string, statusAtual: boolean) => {
    try {
      setError(null);
      await professorService.toggleAtivo(id, statusAtual);
      await fetchAll();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    professores,
    loading,
    error,
    fetchAll,
    create,
    update,
    toggleAtivo,
  };
}
