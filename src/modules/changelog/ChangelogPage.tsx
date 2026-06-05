import React from 'react';
import { useChangelog } from '@/hooks/useChangelog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Newspaper, Loader2, ArrowLeft } from 'lucide-react';
import { ChangelogTipo } from './changelogService';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function ChangelogPage() {
  const { historico, isHistoricoLoading } = useChangelog();
  const navigate = useNavigate();

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

  if (isHistoricoLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  // Agrupar por versão
  const agrupadoPorVersao = historico.reduce((acc, item) => {
    if (!acc[item.versao]) {
      acc[item.versao] = [];
    }
    acc[item.versao].push(item);
    return acc;
  }, {} as Record<string, typeof historico>);

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(-1)}
          className="text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 rounded-xl">
            <Newspaper className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Novidades do Sistema</h1>
            <p className="text-sm text-slate-400 mt-1">Histórico completo de atualizações e melhorias</p>
          </div>
        </div>
      </div>

      <div className="space-y-12">
        {Object.entries(agrupadoPorVersao).map(([versao, itens]) => (
          <div key={versao} className="space-y-6 relative">
            <div className="sticky top-0 bg-slate-950/90 backdrop-blur-sm z-10 py-2 border-b border-slate-800/50">
              <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
                Versão {versao}
              </h2>
            </div>
            
            <div className="space-y-4 pl-4 sm:pl-8 border-l border-slate-800">
              {itens.map((item) => (
                <div key={item.id} className="relative">
                  <div className="absolute -left-[21px] sm:-left-[37px] top-1.5 w-2 h-2 rounded-full bg-slate-600 border border-slate-950" />
                  
                  <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-5 hover:border-slate-700/50 transition-colors">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className={`text-xs px-2.5 py-0.5 rounded-md border ${getBadgeStyle(item.tipo)} font-medium`}>
                        {getBadgeLabel(item.tipo)}
                      </span>
                      <span className="text-sm text-slate-500">
                        {format(new Date(item.criado_em), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-slate-200 mb-2">{item.titulo}</h3>
                    
                    {item.descricao && (
                      <div className="text-slate-400 text-sm whitespace-pre-line leading-relaxed prose prose-invert max-w-none prose-p:my-1">
                        {item.descricao}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {historico.length === 0 && (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
            <Newspaper className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Nenhuma novidade registrada ainda.</p>
          </div>
        )}
      </div>
    </div>
  );
}
