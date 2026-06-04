import { useState, useCallback, useEffect } from 'react';
import { pagamentoService, type PagamentoWithRelations } from '@/modules/pagamentos/pagamentoService';
import { isBefore, parseISO, startOfToday } from 'date-fns';
import type { Database } from '@/types/database';

type PagamentoInsert = Database['public']['Tables']['pagamentos']['Insert'];
type PagamentoUpdate = Database['public']['Tables']['pagamentos']['Update'];

export function usePagamentos() {
  const [pagamentos, setPagamentos] = useState<PagamentoWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const processarPagamentos = (data: PagamentoWithRelations[]) => {
    const hoje = startOfToday();
    return data.map(p => {
      // Regra de Negócio: Se está pendente e a data de vencimento já passou, é considerado atrasado.
      // Note que a coluna `status` no banco só armazena: pendente, pago, cancelado.
      if (p.status === 'pendente' && p.data_vencimento) {
        const vencimento = parseISO(p.data_vencimento);
        if (isBefore(vencimento, hoje)) {
          return { ...p, status: 'atrasado' };
        }
      }
      return p;
    });
  };

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await pagamentoService.getAll();
      setPagamentos(processarPagamentos(data));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const create = async (data: Omit<PagamentoInsert, 'id' | 'criado_em' | 'atualizado_em'>) => {
    try {
      setError(null);
      await pagamentoService.create(data);
      await fetchAll();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const insertMany = async (data: Omit<PagamentoInsert, 'id' | 'criado_em' | 'atualizado_em'>[]) => {
    try {
      setError(null);
      await pagamentoService.insertMany(data);
      await fetchAll();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const update = async (id: string, data: Partial<PagamentoUpdate>) => {
    try {
      setError(null);
      await pagamentoService.update(id, data);
      await fetchAll();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const marcarPago = async (id: string, data_pagamento: string, metodo: string) => {
    try {
      setError(null);
      await pagamentoService.marcarPago(id, data_pagamento, metodo);
      await fetchAll();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const cancelar = async (id: string) => {
    try {
      setError(null);
      await pagamentoService.cancelar(id);
      await fetchAll();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    pagamentos,
    loading,
    error,
    fetchAll,
    create,
    insertMany,
    update,
    marcarPago,
    cancelar,
  };
}
