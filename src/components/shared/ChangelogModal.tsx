import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useChangelog } from '@/hooks/useChangelog';
import { ChangelogEntry, ChangelogTipo } from '@/modules/changelog/changelogService';

interface ChangelogModalProps {
  userId: string;
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
}

export function ChangelogModal({ userId, externalOpen = false, onExternalOpenChange }: ChangelogModalProps) {
  const { naoLidos, totalNaoLidos, marcarComoLido } = useChangelog(userId);
  const [internalOpen, setInternalOpen] = useState(false);
  const navigate = useNavigate();

  const isModalOpen = externalOpen || internalOpen;

  const handleOpenChange = (isOpen: boolean) => {
    if (onExternalOpenChange) onExternalOpenChange(isOpen);
    setInternalOpen(isOpen);
  };

  useEffect(() => {
    if (totalNaoLidos > 0) {
      // Verifica no localStorage se já foi exibido nesta sessão/data
      const today = new Date().toISOString().split('T')[0];
      const storageKey = `changelog_modal_shown_${userId}_${today}`;
      
      if (!localStorage.getItem(storageKey)) {
        // Aguarda 800ms antes de exibir para suavidade
        const timer = setTimeout(() => {
          setInternalOpen(true);
          localStorage.setItem(storageKey, 'true');
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [totalNaoLidos, userId]);

  const handleEntendido = async () => {
    const ids = naoLidos.map(item => item.id);
    await marcarComoLido(ids);
    handleOpenChange(false);
  };

  const getBadgeStyle = (tipo: ChangelogTipo) => {
    switch (tipo) {
      case 'feature': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'fix': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'melhoria': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'breaking': return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'seguranca': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const getBadgeLabel = (tipo: ChangelogTipo) => {
    switch (tipo) {
      case 'feature': return 'Nova função';
      case 'fix': return 'Correção';
      case 'melhoria': return 'Melhoria';
      case 'breaking': return 'Atenção';
      case 'seguranca': return 'Segurança';
      default: return tipo;
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={(isOpen) => {
      // Bloqueia fechar ao clicar fora (backdrop) se ainda não clicou em "Entendido"
      // Mas se não tiver não lidos, pode fechar normalmente (ex: abriu pelo sino)
      if (!isOpen && totalNaoLidos > 0) return;
      handleOpenChange(isOpen);
    }}>
      <DialogContent 
        className="sm:max-w-[500px] bg-slate-950 text-slate-100 border-slate-800 max-h-[80vh] flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            Novidades do Sistema
            <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">
              {totalNaoLidos} {totalNaoLidos === 1 ? 'item' : 'itens'}
            </span>
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Veja o que mudou desde o seu último acesso.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4 my-4 custom-scrollbar">
          {naoLidos.map((item) => (
            <div key={item.id} className="border border-slate-800 rounded-lg p-4 bg-slate-900/50">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs px-2 py-0.5 rounded border ${getBadgeStyle(item.tipo)} font-medium`}>
                  {getBadgeLabel(item.tipo)}
                </span>
                <span className="text-xs text-slate-500 font-mono">v{item.versao}</span>
                <span className="text-xs text-slate-500 ml-auto">
                  {format(new Date(item.criado_em), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
              </div>
              <h4 className="font-semibold text-slate-200 text-base mb-1">{item.titulo}</h4>
              {item.descricao && (
                <p className="text-sm text-slate-400 whitespace-pre-line leading-relaxed">
                  {item.descricao}
                </p>
              )}
            </div>
          ))}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:justify-between items-center mt-2 border-t border-slate-800 pt-4">
          <Button 
            type="button" 
            variant="link" 
            className="text-slate-400 hover:text-indigo-400 p-0 h-auto"
            onClick={() => {
              handleEntendido();
              navigate('/changelog');
            }}
          >
            Ver histórico completo
          </Button>
          <Button 
            type="button" 
            className="bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto"
            onClick={handleEntendido}
          >
            Entendido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
