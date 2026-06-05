import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pagamentoService, type PagamentoWithRelations } from '@/modules/pagamentos/pagamentoService';
import { isBefore, parseISO, startOfToday } from 'date-fns';
import type { Database } from '@/types/database';

type PagamentoInsert = Database['public']['Tables']['pagamentos']['Insert'];
type PagamentoUpdate = Database['public']['Tables']['pagamentos']['Update'];

const QUERY_KEY = ['pagamentos'] as const;

// Regra de Negócio: status "atrasado" é calculado no frontend.
// O banco armazena apenas: pendente, pago, cancelado.
function processarPagamentos(data: PagamentoWithRelations[]): PagamentoWithRelations[] {
  const hoje = startOfToday();
  return data.map(p => {
    if (p.status === 'pendente' && p.data_vencimento) {
      const vencimento = parseISO(p.data_vencimento);
      if (isBefore(vencimento, hoje)) {
        return { ...p, status: 'atrasado' };
      }
    }
    return p;
  });
}

export function usePagamentos() {
  const queryClient = useQueryClient();

  const { data: rawData = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: pagamentoService.getAll,
    // Aplica processamento de status "atrasado" via select (sem nova request)
    select: processarPagamentos,
  });

  const pagamentos = rawData;
  const error = queryError ? (queryError as Error).message : null;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  const createMutation = useMutation({
    mutationFn: (data: Omit<PagamentoInsert, 'id' | 'criado_em' | 'atualizado_em'>) =>
      pagamentoService.create(data),
    onSuccess: invalidate,
  });

  const insertManyMutation = useMutation({
    mutationFn: (data: Omit<PagamentoInsert, 'id' | 'criado_em' | 'atualizado_em'>[]) =>
      pagamentoService.insertMany(data),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PagamentoUpdate> }) =>
      pagamentoService.update(id, data),
    onSuccess: invalidate,
  });

  const marcarPagoMutation = useMutation({
    mutationFn: ({ id, data_pagamento, metodo }: { id: string; data_pagamento: string; metodo: string }) =>
      pagamentoService.marcarPago(id, data_pagamento, metodo),
    onSuccess: invalidate,
  });

  const cancelarMutation = useMutation({
    mutationFn: (id: string) => pagamentoService.cancelar(id),
    onSuccess: invalidate,
  });

  // Interface pública idêntica ao hook anterior
  const create = async (data: Omit<PagamentoInsert, 'id' | 'criado_em' | 'atualizado_em'>) => {
    await createMutation.mutateAsync(data);
  };

  const insertMany = async (data: Omit<PagamentoInsert, 'id' | 'criado_em' | 'atualizado_em'>[]) => {
    await insertManyMutation.mutateAsync(data);
  };

  const update = async (id: string, data: Partial<PagamentoUpdate>) => {
    await updateMutation.mutateAsync({ id, data });
  };

  const marcarPago = async (id: string, data_pagamento: string, metodo: string) => {
    await marcarPagoMutation.mutateAsync({ id, data_pagamento, metodo });
  };

  const cancelar = async (id: string) => {
    await cancelarMutation.mutateAsync(id);
  };

  const fetchAll = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

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
