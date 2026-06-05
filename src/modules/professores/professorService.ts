import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/types/database';
import { resizeImage } from '@/lib/imageUtils';

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
  },

  async uploadFoto(professorId: string, file: File): Promise<string> {
    // Validar tipo e tamanho
    const allowed = ['image/jpeg','image/png','image/webp'];
    if (!allowed.includes(file.type))
      throw new Error('Formato invalido. Use JPG, PNG ou WebP.');
    if (file.size > 2 * 1024 * 1024)
      throw new Error('Imagem muito grande. Maximo: 2MB.');
 
    // Redimensionar para max 400x400 via canvas
    const resized = await resizeImage(file, 400, 400);
 
    const path = `${professorId}/foto.webp`;
    const { error } = await supabase.storage.from('professores-fotos')
      .upload(path, resized, { upsert: true, contentType: 'image/webp' });
    if (error) throw new Error(`Erro no upload: ${error.message}`);
 
    const { data } = supabase.storage.from('professores-fotos')
      .getPublicUrl(path);
    return data.publicUrl;
  }
};
