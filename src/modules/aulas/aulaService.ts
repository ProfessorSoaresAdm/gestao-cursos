import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/types/database';

type AulaRow = Database['public']['Tables']['aulas']['Row'];
type AulaInsert = Database['public']['Tables']['aulas']['Insert'];
type AulaUpdate = Database['public']['Tables']['aulas']['Update'];

export type AulaWithProfessor = AulaRow & {
  professores?: {
    nome: string;
    foto_url: string | null;
    instagram_handle: string | null;
  } | null;
  monitor?: {
    id: string;
    nome: string;
  } | null;
};

export const getNomeMonitor = (aula: AulaWithProfessor): string =>
  aula.monitor?.nome ?? 'Sem monitor';

export const aulaService = {
  async getAll(): Promise<AulaWithProfessor[]> {
    const { data, error } = await supabase
      .from('aulas')
      .select(`
        *,
        professores (
          nome,
          foto_url,
          instagram_handle
        ),
        monitor:profiles!monitor_id (
          id,
          nome
        )
      `)
      .order('data_hora', { ascending: false });
      
    if (error) throw new Error(`Erro ao buscar aulas: ${error.message}`);
    return data as AulaWithProfessor[];
  },

  async getById(id: string): Promise<AulaWithProfessor | null> {
    const { data, error } = await supabase
      .from('aulas')
      .select(`
        *,
        professores (
          nome,
          foto_url,
          instagram_handle
        ),
        monitor:profiles!monitor_id (
          id,
          nome
        )
      `)
      .eq('id', id)
      .single();
      
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Erro ao buscar aula: ${error.message}`);
    }
    return data as AulaWithProfessor | null;
  },

  async create(data: Omit<AulaInsert, 'id' | 'criado_em' | 'atualizado_em'>): Promise<AulaRow> {
    const { data: result, error } = await supabase
      .from('aulas')
      .insert([data])
      .select()
      .single();
      
    if (error) throw new Error(`Erro ao criar aula: ${error.message}`);
    return result;
  },

  async insertMany(data: Omit<AulaInsert, 'id' | 'criado_em' | 'atualizado_em'>[]): Promise<AulaRow[]> {
    const { data: result, error } = await supabase
      .from('aulas')
      .insert(data)
      .select();
      
    if (error) throw new Error(`Erro ao importar aulas: ${error.message}`);
    return result;
  },

  async update(id: string, data: Partial<AulaUpdate>): Promise<AulaRow> {
    const { data: result, error } = await supabase
      .from('aulas')
      .update(data)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw new Error(`Erro ao atualizar aula: ${error.message}`);
    return result;
  },

  async updateStatus(id: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('aulas')
      .update({ status })
      .eq('id', id);
      
    if (error) throw new Error(`Erro ao alterar status da aula: ${error.message}`);
  }
};
