import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/types/database';

type PagamentoRow = Database['public']['Tables']['pagamentos']['Row'];
type PagamentoInsert = Database['public']['Tables']['pagamentos']['Insert'];
type PagamentoUpdate = Database['public']['Tables']['pagamentos']['Update'];

export type PagamentoWithRelations = PagamentoRow & {
  professores?: { nome: string } | null;
  aulas?: { titulo: string } | null;
};

export const pagamentoService = {
  async getAll(): Promise<PagamentoWithRelations[]> {
    const { data, error } = await supabase
      .from('pagamentos')
      .select(`
        *,
        professores (nome),
        aulas (titulo)
      `)
      .order('data_vencimento', { ascending: false });
      
    if (error) throw new Error(`Erro ao buscar pagamentos: ${error.message}`);
    return data as PagamentoWithRelations[];
  },

  async getById(id: string): Promise<PagamentoWithRelations | null> {
    const { data, error } = await supabase
      .from('pagamentos')
      .select(`
        *,
        professores (nome),
        aulas (titulo)
      `)
      .eq('id', id)
      .single();
      
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Erro ao buscar pagamento: ${error.message}`);
    }
    return data as PagamentoWithRelations | null;
  },

  async create(data: Omit<PagamentoInsert, 'id' | 'criado_em' | 'atualizado_em'>): Promise<PagamentoRow> {
    const { data: result, error } = await supabase
      .from('pagamentos')
      .insert([data])
      .select()
      .single();
      
    if (error) throw new Error(`Erro ao criar pagamento: ${error.message}`);
    return result;
  },

  async update(id: string, data: Partial<PagamentoUpdate>): Promise<PagamentoRow> {
    const { data: result, error } = await supabase
      .from('pagamentos')
      .update(data)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw new Error(`Erro ao atualizar pagamento: ${error.message}`);
    return result;
  },

  async marcarPago(id: string, data_pagamento: string, metodo: string): Promise<void> {
    const { error } = await supabase
      .from('pagamentos')
      .update({ 
        status: 'pago',
        data_pagamento,
        metodo
      })
      .eq('id', id);
      
    if (error) throw new Error(`Erro ao marcar pagamento como pago: ${error.message}`);
  },

  async cancelar(id: string): Promise<void> {
    const { error } = await supabase
      .from('pagamentos')
      .update({ status: 'cancelado' })
      .eq('id', id);
      
    if (error) throw new Error(`Erro ao cancelar pagamento: ${error.message}`);
  }
};
