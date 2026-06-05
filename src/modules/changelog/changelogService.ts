import { supabase } from '@/integrations/supabase/client';

export type ChangelogTipo = 'feature' | 'fix' | 'melhoria' | 'breaking' | 'seguranca';

export interface ChangelogEntry {
  id: string;
  versao: string;
  tipo: ChangelogTipo;
  titulo: string;
  descricao: string | null;
  autor: string;
  criado_em: string;
}

export const changelogService = {
  // Busca entradas do changelog não lidas pelo usuário atual
  async getNaoLidos(userId: string): Promise<ChangelogEntry[]> {
    // Buscar todos os changelogs lidos pelo usuario
    const { data: lidos, error: lidosError } = await supabase
      .from('changelogs_lidos')
      .select('changelog_id')
      .eq('user_id', userId);

    if (lidosError) throw new Error(`Erro ao buscar changelogs lidos: ${lidosError.message}`);

    const lidosIds = lidos?.map(l => l.changelog_id) || [];

    // Se nao tiver lido nenhum, buscar todos, senao buscar os que o id nao esta na lista
    let query = supabase
      .from('changelogs')
      .select('*')
      .order('criado_em', { ascending: false });

    // Em Supabase, o filtro .not('id', 'in', `(${lidosIds.join(',')})`)
    // só funciona bem se a lista não estiver vazia
    if (lidosIds.length > 0) {
      query = query.not('id', 'in', `(${lidosIds.join(',')})`);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Erro ao buscar changelogs não lidos: ${error.message}`);
    
    return data as ChangelogEntry[];
  },

  // Busca histórico completo paginado
  async getAll(page = 0, pageSize = 20): Promise<ChangelogEntry[]> {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from('changelogs')
      .select('*')
      .order('criado_em', { ascending: false })
      .range(from, to);

    if (error) throw new Error(`Erro ao buscar histórico de changelogs: ${error.message}`);
    
    return data as ChangelogEntry[];
  },

  // Marca um array de IDs como lido pelo usuário atual
  async marcarComoLido(changelogIds: string[], userId: string): Promise<void> {
    if (!changelogIds.length) return;

    const payload = changelogIds.map(id => ({
      changelog_id: id,
      user_id: userId
    }));

    const { error } = await supabase
      .from('changelogs_lidos')
      .upsert(payload, { onConflict: 'changelog_id,user_id' });

    if (error) throw new Error(`Erro ao marcar changelogs como lidos: ${error.message}`);
  }
};
