import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/types/database';

type PessoalRow = Database['public']['Tables']['pessoal']['Row'];
type PessoalInsert = Database['public']['Tables']['pessoal']['Insert'];
type PessoalUpdate = Database['public']['Tables']['pessoal']['Update'];

export const pessoalService = {
  async getAll(): Promise<PessoalRow[]> {
    const { data, error } = await supabase
      .from('pessoal')
      .select('*')
      .order('nome', { ascending: true });
      
    if (error) throw new Error(`Erro ao buscar pessoal: ${error.message}`);
    return data as PessoalRow[];
  },

  async getById(id: string): Promise<PessoalRow | null> {
    const { data, error } = await supabase
      .from('pessoal')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Erro ao buscar funcionário: ${error.message}`);
    }
    return data as PessoalRow | null;
  },

  async create(data: Omit<PessoalInsert, 'id' | 'criado_em' | 'atualizado_em'>): Promise<PessoalRow> {
    const { data: result, error } = await supabase
      .from('pessoal')
      .insert([data])
      .select()
      .single();
      
    if (error) throw new Error(`Erro ao criar funcionário: ${error.message}`);
    return result;
  },

  async update(id: string, data: Partial<PessoalUpdate>): Promise<PessoalRow> {
    const { data: result, error } = await supabase
      .from('pessoal')
      .update(data)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw new Error(`Erro ao atualizar funcionário: ${error.message}`);
    return result;
  },

  async updateStatus(id: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('pessoal')
      .update({ status })
      .eq('id', id);
      
    if (error) throw new Error(`Erro ao alterar status do funcionário: ${error.message}`);
  }
};
