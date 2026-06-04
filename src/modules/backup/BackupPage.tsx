import React, { useState } from 'react';
import { useAuth } from '@/auth/useAuth';
import { useBackup, FrequenciaBackup } from '@/hooks/useBackup';
import { formatDistanceToNow, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ShieldAlert, Database, CloudUpload, Download, Save, Clock, Server, CheckCircle2, AlertTriangle, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function BackupPage() {
  const { role, loading: authLoading } = useAuth();
  const { 
    loading, 
    ultimaData, 
    frequencia, 
    webhookUrl, 
    setFrequencia, 
    setWebhookUrl, 
    executarBackupLocal, 
    executarBackupNuvem 
  } = useBackup();

  const [urlInput, setUrlInput] = useState(webhookUrl);

  if (authLoading) {
    return (
      <div className="p-6 flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (role !== 'admin') {
    return (
      <div className="p-6 max-w-3xl mx-auto mt-10">
        <div className="bg-red-950/30 border border-red-900/50 p-8 rounded-xl flex flex-col items-center justify-center text-center">
          <div className="bg-red-900/50 p-4 rounded-full mb-4">
            <ShieldAlert className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mb-2">Acesso Negado</h1>
          <p className="text-slate-400">
            O Centro de Segurança e Backups é restrito a Administradores.
          </p>
        </div>
      </div>
    );
  }

  const handleSalvarWebhook = () => {
    setWebhookUrl(urlInput);
    toast.success('URL do Webhook salva com sucesso!');
  };

  const handleBackupLocal = async () => {
    try {
      await executarBackupLocal();
      toast.success('Backup local concluído e baixado com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao realizar backup: ' + err.message);
    }
  };

  const handleBackupNuvem = async () => {
    if (!webhookUrl) {
      toast.error('Configure uma URL de Webhook primeiro!');
      return;
    }
    try {
      await executarBackupNuvem();
      toast.success('Backup enviado para a Nuvem com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao enviar backup: ' + err.message);
    }
  };

  const diasDesdeUltimoBackup = ultimaData 
    ? Math.floor((new Date().getTime() - parseISO(ultimaData).getTime()) / (1000 * 3600 * 24))
    : null;

  let statusColor = "text-emerald-400";
  let statusBg = "bg-emerald-400/10";
  let StatusIcon = CheckCircle2;
  let statusMessage = "Sistema Seguro";

  if (diasDesdeUltimoBackup === null) {
    statusColor = "text-amber-400";
    statusBg = "bg-amber-400/10";
    StatusIcon = AlertTriangle;
    statusMessage = "Nenhum backup recente";
  } else if (frequencia === 'diario' && diasDesdeUltimoBackup >= 1) {
    statusColor = "text-amber-400";
    statusBg = "bg-amber-400/10";
    StatusIcon = AlertTriangle;
    statusMessage = "Backup Diário Atrasado";
  } else if (frequencia === 'semanal' && diasDesdeUltimoBackup >= 7) {
    statusColor = "text-amber-400";
    statusBg = "bg-amber-400/10";
    StatusIcon = AlertTriangle;
    statusMessage = "Backup Semanal Atrasado";
  } else if (frequencia === 'mensal' && diasDesdeUltimoBackup >= 30) {
    statusColor = "text-amber-400";
    statusBg = "bg-amber-400/10";
    StatusIcon = AlertTriangle;
    statusMessage = "Backup Mensal Atrasado";
  } else if (diasDesdeUltimoBackup >= 60) {
    statusColor = "text-red-400";
    statusBg = "bg-red-400/10";
    StatusIcon = AlertTriangle;
    statusMessage = "Alerta Crítico: Sem backups";
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
            <Server className="w-8 h-8 text-indigo-400" /> Centro de Backups
          </h1>
          <p className="text-slate-400 mt-1">Gerencie a segurança e exportação bruta dos dados do sistema.</p>
        </div>
        <div className={`px-4 py-2 rounded-full flex items-center gap-2 border ${statusBg} border-current ${statusColor}`}>
          <StatusIcon className="w-5 h-5" />
          <span className="font-semibold">{statusMessage}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card Resumo */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-slate-400" />
              <h3 className="text-lg font-medium text-slate-200">Último Backup</h3>
            </div>
            {ultimaData ? (
              <>
                <p className="text-3xl font-bold text-slate-100">
                  {formatDistanceToNow(parseISO(ultimaData), { addSuffix: true, locale: ptBR })}
                </p>
                <p className="text-sm text-slate-400 mt-2">
                  Realizado em {format(parseISO(ultimaData), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                </p>
              </>
            ) : (
              <p className="text-slate-400 italic">Nenhum backup manual registrado nesta máquina.</p>
            )}
          </div>
          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-sm text-slate-400 mb-2">Agendamento de Lembretes:</p>
            <select 
              value={frequencia}
              onChange={(e) => setFrequencia(e.target.value as FrequenciaBackup)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="diario">Lembrar Diariamente</option>
              <option value="semanal">Lembrar Semanalmente</option>
              <option value="mensal">Lembrar Mensalmente</option>
              <option value="nunca">Não me lembrar</option>
            </select>
          </div>
        </div>

        {/* Card Download Local */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-medium text-slate-200">Exportação Manual</h3>
          </div>
          <p className="text-sm text-slate-400 mb-6">
            Gera um arquivo unificado <code>.json</code> contendo todas as tabelas brutas do sistema. Ideal para armazenamento em pendrives, HDs externos ou consulta analítica em Python/Excel.
          </p>
          <Button 
            onClick={handleBackupLocal} 
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-md"
          >
            <Download className="w-5 h-5 mr-2" />
            {loading ? 'Processando...' : 'Baixar Backup Local'}
          </Button>
        </div>

        {/* Card Backup Nuvem / Webhook */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <CloudUpload className="w-5 h-5 text-sky-400" />
            <h3 className="text-lg font-medium text-slate-200">Integração Externa</h3>
          </div>
          <p className="text-sm text-slate-400 mb-4">
            Configure uma URL de automação (ex: Zapier, Make.com) para enviar este backup diretamente para o seu Google Drive, Dropbox ou E-mail corporativo.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Webhook URL de Destino</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                  <Input 
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://hooks.zapier.com/..." 
                    className="pl-9 bg-slate-950 border-slate-700 text-slate-200"
                  />
                </div>
                <Button onClick={handleSalvarWebhook} variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 px-3">
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Button 
              onClick={handleBackupNuvem} 
              disabled={loading || !webhookUrl}
              className="w-full bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 h-12"
            >
              <CloudUpload className="w-5 h-5 mr-2" />
              {loading ? 'Enviando...' : 'Enviar para Nuvem'}
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-indigo-950/20 border border-indigo-900/50 rounded-xl p-6">
        <h4 className="text-lg font-medium text-indigo-300 mb-2 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5" /> Você Sabia?
        </h4>
        <p className="text-sm text-indigo-200/80 leading-relaxed">
          O servidor principal (Supabase) onde sua base de dados está hospedada possui a tecnologia <strong>Point-in-Time Recovery (PITR)</strong> habilitada nativamente ou via painel de administração da plataforma. Isso significa que backups automáticos e incrementais já ocorrem nos bastidores a nível de servidor 24 horas por dia, 7 dias por semana, protegendo seus dados contra exclusões acidentais ou falhas críticas. O propósito desta página é fornecer uma cópia bruta (física) para sua própria auditoria ou integrações externas.
        </p>
      </div>
    </div>
  );
}
