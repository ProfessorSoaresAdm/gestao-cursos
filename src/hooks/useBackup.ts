import { useState, useCallback, useEffect } from 'react';
import { backupService } from '@/modules/backup/backupService';

export type FrequenciaBackup = 'diario' | 'semanal' | 'mensal' | 'nunca';

export function useBackup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Preferências
  const [frequencia, setFrequenciaState] = useState<FrequenciaBackup>('semanal');
  const [ultimaData, setUltimaDataState] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrlState] = useState<string>('');

  useEffect(() => {
    // Carrega preferências salvas no navegador
    const storedFreq = localStorage.getItem('backup_frequencia') as FrequenciaBackup;
    const storedDate = localStorage.getItem('backup_ultima_data');
    const storedHook = localStorage.getItem('backup_webhook_url');

    if (storedFreq) setFrequenciaState(storedFreq);
    if (storedDate) setUltimaDataState(storedDate);
    if (storedHook) setWebhookUrlState(storedHook);
  }, []);

  const setFrequencia = (freq: FrequenciaBackup) => {
    setFrequenciaState(freq);
    localStorage.setItem('backup_frequencia', freq);
  };

  const setWebhookUrl = (url: string) => {
    setWebhookUrlState(url);
    localStorage.setItem('backup_webhook_url', url);
  };

  const registrarSucesso = () => {
    const dataIso = new Date().toISOString();
    setUltimaDataState(dataIso);
    localStorage.setItem('backup_ultima_data', dataIso);
  };

  const executarBackupLocal = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const payload = await backupService.fetchAllData();
      backupService.downloadJson(payload);
      registrarSucesso();
      return true;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const executarBackupNuvem = useCallback(async (customWebhook?: string) => {
    const targetUrl = customWebhook || webhookUrl;
    if (!targetUrl) throw new Error("Nenhuma URL de Webhook configurada.");
    
    try {
      setLoading(true);
      setError(null);
      const payload = await backupService.fetchAllData();
      await backupService.exportToWebhook(payload, targetUrl);
      registrarSucesso();
      return true;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [webhookUrl]);

  return {
    loading,
    error,
    frequencia,
    ultimaData,
    webhookUrl,
    setFrequencia,
    setWebhookUrl,
    executarBackupLocal,
    executarBackupNuvem
  };
}
