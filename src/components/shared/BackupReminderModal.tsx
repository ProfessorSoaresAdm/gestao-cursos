import React, { useEffect, useState } from 'react';
import { useBackup } from '@/hooks/useBackup';
import { useAuth } from '@/auth/useAuth';
import { useNavigate } from 'react-router-dom';
import { parseISO } from 'date-fns';
import { Server, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function BackupReminderModal() {
  const { role } = useAuth();
  const { frequencia, ultimaData } = useBackup();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Apenas Administradores recebem o lembrete de backup
    if (role !== 'admin') return;

    const checarAtraso = () => {
      // Se frequencia for 'nunca', não alerta
      if (!frequencia || frequencia === 'nunca') return;

      const diasDesdeUltimoBackup = ultimaData 
        ? Math.floor((new Date().getTime() - parseISO(ultimaData).getTime()) / (1000 * 3600 * 24))
        : null;

      let deveAlertar = false;

      if (diasDesdeUltimoBackup === null) {
        // Nunca fez backup local, alerta de imediato
        deveAlertar = true;
      } else if (frequencia === 'diario' && diasDesdeUltimoBackup >= 1) {
        deveAlertar = true;
      } else if (frequencia === 'semanal' && diasDesdeUltimoBackup >= 7) {
        deveAlertar = true;
      } else if (frequencia === 'mensal' && diasDesdeUltimoBackup >= 30) {
        deveAlertar = true;
      }

      // Se já mostramos o modal nesta sessão de navegador, não mostramos de novo
      // para não irritar o usuário toda hora que ele recarregar a tela
      const sessionAlerta = sessionStorage.getItem('backup_alerta_mostrado');

      if (deveAlertar && !sessionAlerta) {
        setIsOpen(true);
        sessionStorage.setItem('backup_alerta_mostrado', 'true');
      }
    };

    // Pequeno delay para não assustar o usuário logo no piscar do login
    const timer = setTimeout(checarAtraso, 2000);
    return () => clearTimeout(timer);
  }, [role, frequencia, ultimaData]);

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="bg-slate-900 border-slate-800">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl text-slate-100 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Lembrete de Backup
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-300">
            Faz um tempo desde a sua última exportação manual (Backup) dos dados físicos do sistema para o seu dispositivo ou nuvem. 
            Recomendamos realizar um novo backup agora para manter suas cópias analíticas de segurança atualizadas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white">
            Lembrar mais tarde
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => {
              setIsOpen(false);
              navigate('/backup');
            }}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Ir para Central de Backups
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
