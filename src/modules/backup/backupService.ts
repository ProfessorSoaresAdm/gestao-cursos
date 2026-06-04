import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export const backupService = {
  async fetchAllData() {
    // Busca dados de todas as tabelas em paralelo
    const [
      { data: profiles, error: errProfiles },
      { data: professores, error: errProf },
      { data: aulas, error: errAulas },
      { data: pagamentos, error: errPag },
      { data: pessoal, error: errPessoal }
    ] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('professores').select('*'),
      supabase.from('aulas').select('*'),
      supabase.from('pagamentos').select('*'),
      supabase.from('pessoal').select('*')
    ]);

    // O RLS cuidará para que 'pessoal' falhe ou retorne nulo se não for admin,
    // mas a tela de backup é restrita a admin, então deve retornar sucesso.
    if (errProfiles) throw new Error(`Erro profiles: ${errProfiles.message}`);
    if (errProf) throw new Error(`Erro professores: ${errProf.message}`);
    if (errAulas) throw new Error(`Erro aulas: ${errAulas.message}`);
    if (errPag) throw new Error(`Erro pagamentos: ${errPag.message}`);
    if (errPessoal) throw new Error(`Erro pessoal: ${errPessoal.message}`);

    const payload = {
      versao_exportacao: '1.0',
      data_exportacao: new Date().toISOString(),
      dados: {
        profiles,
        professores,
        aulas,
        pagamentos,
        pessoal
      }
    };

    return payload;
  },

  downloadJson(payload: any) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    
    const dataFormatada = format(new Date(), 'yyyy_MM_dd_HHmm');
    downloadAnchorNode.setAttribute("download", `controle_backup_${dataFormatada}.json`);
    
    document.body.appendChild(downloadAnchorNode); // requerimento no firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  },

  async exportToWebhook(payload: any, webhookUrl: string) {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Falha ao enviar webhook. Status: ${response.status}`);
    }
    
    return true;
  }
};
