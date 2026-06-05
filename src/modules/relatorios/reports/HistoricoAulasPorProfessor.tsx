import React, { useMemo } from 'react';
import { useAulas } from '@/hooks/useAulas';
import { useProfessores } from '@/hooks/useProfessores';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import { exportToCSV } from '@/lib/export';

export default function HistoricoAulasPorProfessor() {
  const { aulas, loading: aulasLoading } = useAulas();
  const { professores, loading: profLoading } = useProfessores();

  const data = useMemo(() => {
    const profMap: Record<string, { nome: string; realizadas: number; canceladas: number; outras: number; total: number }> = {};
    
    professores.forEach(p => {
      profMap[p.id] = { nome: p.nome, realizadas: 0, canceladas: 0, outras: 0, total: 0 };
    });

    aulas.forEach(a => {
      if (a.professor_id && profMap[a.professor_id]) {
        profMap[a.professor_id].total += 1;
        if (a.status === 'realizada') profMap[a.professor_id].realizadas += 1;
        else if (a.status === 'cancelada') profMap[a.professor_id].canceladas += 1;
        else profMap[a.professor_id].outras += 1; // agendada, reagendada, em_andamento
      }
    });

    return Object.values(profMap)
      .filter(p => p.total > 0)
      .map(p => ({
        ...p,
        taxaRealizacao: p.total > 0 ? ((p.realizadas / p.total) * 100).toFixed(1) + '%' : '0%'
      }))
      .sort((a, b) => b.total - a.total);
  }, [aulas, professores]);

  const handleExportCSV = () => {
    exportToCSV(data, 'historico_aulas', [
      { key: 'nome', label: 'Professor' },
      { key: 'total', label: 'Total Agendado' },
      { key: 'realizadas', label: 'Realizadas' },
      { key: 'canceladas', label: 'Canceladas' },
      { key: 'taxaRealizacao', label: 'Taxa de Realização' },
    ]);
  };

  if (aulasLoading || profLoading) return <div className="p-8 text-center text-slate-400">Carregando dados...</div>;

  return (
    <div className="p-6 print-area bg-slate-900 text-slate-100 min-h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Histórico de Aulas por Professor</h2>
          <p className="text-slate-400">Total de aulas com taxa de realização</p>
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
          <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="nome" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
            <Legend />
            <Bar dataKey="realizadas" name="Realizadas" stackId="a" fill="#10b981" />
            <Bar dataKey="outras" name="Pendentes/Outras" stackId="a" fill="#f59e0b" />
            <Bar dataKey="canceladas" name="Canceladas" stackId="a" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto border border-slate-800 rounded-lg">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-800/50 text-slate-300">
            <tr>
              <th className="px-4 py-3 font-medium">Professor</th>
              <th className="px-4 py-3 font-medium text-center">Total de Aulas</th>
              <th className="px-4 py-3 font-medium text-center">Realizadas</th>
              <th className="px-4 py-3 font-medium text-center">Canceladas</th>
              <th className="px-4 py-3 font-medium text-right">Taxa de Realização</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {data.map(row => (
              <tr key={row.nome} className="hover:bg-slate-800/20">
                <td className="px-4 py-3 font-medium text-slate-200">{row.nome}</td>
                <td className="px-4 py-3 text-center text-slate-300">{row.total}</td>
                <td className="px-4 py-3 text-center text-emerald-400">{row.realizadas}</td>
                <td className="px-4 py-3 text-center text-red-400">{row.canceladas}</td>
                <td className="px-4 py-3 text-right font-medium text-slate-200">{row.taxaRealizacao}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="print-footer" data-date={new Date().toLocaleDateString('pt-BR')} />
    </div>
  );
}
