import React, { useMemo } from 'react';
import { useAulas } from '@/hooks/useAulas';
import { usePagamentos } from '@/hooks/usePagamentos';
import { useProfessores } from '@/hooks/useProfessores';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import { exportToCSV, formatCurrencyExport } from '@/lib/export';

export default function CustoPorProfessor() {
  const { aulas, loading: aulasLoading } = useAulas();
  const { pagamentos, loading: pagLoading } = usePagamentos();
  const { professores, loading: profLoading } = useProfessores();

  const data = useMemo(() => {
    const profMap: Record<string, { nome: string; valorPago: number; aulasRealizadas: number; custoMedio: number }> = {};
    
    professores.forEach(p => {
      profMap[p.id] = { nome: p.nome, valorPago: 0, aulasRealizadas: 0, custoMedio: 0 };
    });

    pagamentos.forEach(p => {
      if (p.status === 'pago' && p.professor_id && profMap[p.professor_id]) {
        profMap[p.professor_id].valorPago += p.valor;
      }
    });

    aulas.forEach(a => {
      if (a.status === 'realizada' && a.professor_id && profMap[a.professor_id]) {
        profMap[a.professor_id].aulasRealizadas += 1;
      }
    });

    return Object.values(profMap)
      .filter(p => p.aulasRealizadas > 0 || p.valorPago > 0)
      .map(p => ({
        ...p,
        custoMedio: p.aulasRealizadas > 0 ? p.valorPago / p.aulasRealizadas : 0
      }))
      .sort((a, b) => b.custoMedio - a.custoMedio);
  }, [aulas, pagamentos, professores]);

  const handleExportCSV = () => {
    exportToCSV(data, 'custo_medio_professor', [
      { key: 'nome', label: 'Professor' },
      { key: 'aulasRealizadas', label: 'Aulas Realizadas' },
      { key: 'valorPago', label: 'Valor Total Pago (R$)', format: formatCurrencyExport },
      { key: 'custoMedio', label: 'Custo Médio/Aula (R$)', format: formatCurrencyExport },
    ]);
  };

  if (aulasLoading || pagLoading || profLoading) return <div className="p-8 text-center text-slate-400">Carregando dados...</div>;

  return (
    <div className="p-6 print-area bg-slate-900 text-slate-100 min-h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Custo Médio por Professor</h2>
          <p className="text-slate-400">Valor total pago ÷ aulas realizadas</p>
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

      <div className="h-80 w-full mb-8">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 20, right: 30, left: 100, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
            <XAxis type="number" stroke="#94a3b8" tickFormatter={(value) => `R$ ${value}`} />
            <YAxis dataKey="nome" type="category" stroke="#94a3b8" width={120} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
              formatter={(value: number) => formatCurrencyExport(value)}
            />
            <Bar dataKey="custoMedio" name="Custo Médio/Aula" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto border border-slate-800 rounded-lg">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-800/50 text-slate-300">
            <tr>
              <th className="px-4 py-3 font-medium">Professor</th>
              <th className="px-4 py-3 font-medium text-center">Aulas Realizadas</th>
              <th className="px-4 py-3 font-medium text-right">Valor Total Pago</th>
              <th className="px-4 py-3 font-medium text-right">Custo Médio / Aula</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {data.map(row => (
              <tr key={row.nome} className="hover:bg-slate-800/20">
                <td className="px-4 py-3 text-slate-200 font-medium">{row.nome}</td>
                <td className="px-4 py-3 text-center text-slate-300">{row.aulasRealizadas}</td>
                <td className="px-4 py-3 text-right text-slate-300">{formatCurrencyExport(row.valorPago)}</td>
                <td className="px-4 py-3 text-right font-bold text-indigo-400">{formatCurrencyExport(row.custoMedio)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="print-footer" data-date={new Date().toLocaleDateString('pt-BR')} />
    </div>
  );
}
