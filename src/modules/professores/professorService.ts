import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/types/database';

type ProfessorRow = Database['public']['Tables']['professores']['Row'];
type ProfessorInsert = Database['public']['Tables']['professores']['Insert'];
type ProfessorUpdate = Database['public']['Tables']['professores']['Update'];

export const professorService = {
  async getAll(): Promise<ProfessorRow[]> {
    const { data, error } = await supabase
      .from('professores')
      .select('*')
      .order('nome', { ascending: true });
      
    if (error) throw new Error(`Erro ao buscar professores: ${error.message}`);
    return data;
  },

  async getById(id: string): Promise<ProfessorRow | null> {
    const { data, error } = await supabase
      .from('professores')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Erro ao buscar professor: ${error.message}`);
    }
    return data;
  },

  async create(data: Omit<ProfessorInsert, 'id' | 'criado_em' | 'atualizado_em'>): Promise<ProfessorRow> {
    const { data: result, error } = await supabase
      .from('professores')
      .insert([data])
      .select()
      .single();
      
    if (error) throw new Error(`Erro ao criar professor: ${error.message}`);
    return result;
  },

  async insertMany(data: Omit<ProfessorInsert, 'id' | 'criado_em' | 'atualizado_em'>[]): Promise<ProfessorRow[]> {
    const { data: result, error } = await supabase
      .from('professores')
      .insert(data)
      .select();
      
    if (error) throw new Error(`Erro ao importar professores: ${error.message}`);
    return result;
  },

  async update(id: string, data: Partial<ProfessorUpdate>): Promise<ProfessorRow> {
    const { data: result, error } = await supabase
      .from('professores')
      .update(data)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw new Error(`Erro ao atualizar professor: ${error.message}`);
    return result;
  },

  async toggleAtivo(id: string, statusAtual: boolean): Promise<void> {
    const { error } = await supabase
      .from('professores')
      .update({ ativo: !statusAtual })
      .eq('id', id);
      
    if (error) throw new Error(`Erro ao alterar status: ${error.message}`);
  }
};
