import React, { useMemo } from 'react';
import { usePagamentos } from '@/hooks/usePagamentos';
import { useProfessores } from '@/hooks/useProfessores';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import { exportToCSV, formatCurrencyExport } from '@/lib/export';

export default function InadimplenciaPorProfessor() {
  const { pagamentos, loading: pagLoading } = usePagamentos();
  const { professores, loading: profLoading } = useProfessores();

  const data = useMemo(() => {
    const profMap: Record<string, { nome: string; atrasados: number; valorTotal: number }> = {};
    
    professores.forEach(p => {
      profMap[p.id] = { nome: p.nome, atrasados: 0, valorTotal: 0 };
    });

    pagamentos.forEach(p => {
      // "atrasado" é status calculado no hook processarPagamentos
      if ((p.status as string) === 'atrasado' && p.professor_id) {
        if (profMap[p.professor_id]) {
          profMap[p.professor_id].atrasados += 1;
          profMap[p.professor_id].valorTotal += p.valor;
        }
      }
    });

    return Object.values(profMap)
      .filter(p => p.atrasados > 0)
      .sort((a, b) => b.valorTotal - a.valorTotal);
  }, [pagamentos, professores]);

  const handleExportCSV = () => {
    exportToCSV(data, 'inadimplencia_professor', [
      { key: 'nome', label: 'Professor' },
      { key: 'atrasados', label: 'Qtd. Pagamentos Atrasados' },
      { key: 'valorTotal', label: 'Valor Total Atrasado (R$)', format: formatCurrencyExport },
    ]);
  };

  if (pagLoading || profLoading) return <div className="p-8 text-center text-slate-400">Carregando dados...</div>;

  return (
    <div className="p-6 print-area bg-slate-900 text-slate-100 min-h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Inadimplência por Professor</h2>
          <p className="text-slate-400">Ranking de pagamentos atrasados</p>
        </div>
        <div className="flex gap-3 no-print">
          <Button variant="outline" onClick={handleExportCSV} className="border-slate-700 hover:bg-slate-800">
            <Download className="w-4 h-4 mr-2" /> CSV
          </Button>
          <Button onClick={() => window.print()} className="bg-indigo-600 hover:bg-indigo-700">
            <Printer className="w-4 h-4 mr-2" /> PDF
          </Button>
        </div>
      </div>

      {data.length > 0 ? (
        <>
          <div className="h-80 w-full mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 20, right: 30, left: 100, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="#94a3b8" tickFormatter={(value) => `R$ ${value}`} />
                <YAxis dataKey="nome" type="category" stroke="#94a3b8" width={120} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                  formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                />
                <Bar dataKey="valorTotal" name="Valor Atrasado" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-800/50 text-slate-300">
                <tr>
                  <th className="px-4 py-3 font-medium">Professor</th>
                  <th className="px-4 py-3 font-medium text-center">Qtd. Atrasados</th>
                  <th className="px-4 py-3 font-medium text-right">Valor Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {data.map(row => (
                  <tr key={row.nome} className="hover:bg-slate-800/20">
                    <td className="px-4 py-3 font-medium text-slate-200">{row.nome}</td>
                    <td className="px-4 py-3 text-center text-slate-300">{row.atrasados}</td>
                    <td className="px-4 py-3 text-right text-red-400 font-bold">{formatCurrencyExport(row.valorTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="text-center p-12 text-emerald-400 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
          Não há pagamentos atrasados registrados no sistema.
        </div>
      )}

      <div className="print-footer" data-date={new Date().toLocaleDateString('pt-BR')} />
    </div>
  );
}
