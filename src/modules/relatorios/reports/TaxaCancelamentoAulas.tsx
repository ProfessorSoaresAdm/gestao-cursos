import React, { useMemo, useState } from 'react';
import { useAulas } from '@/hooks/useAulas';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import { exportToCSV } from '@/lib/export';

export default function TaxaCancelamentoAulas() {
  const { aulas, loading } = useAulas();
  const [year, setYear] = useState(new Date().getFullYear().toString());

  const data = useMemo(() => {
    const monthlyData: Record<string, { month: string; canceladas: number; total: number; taxa: number }> = {};
    
    for (let i = 0; i < 12; i++) {
      const monthStr = format(new Date(parseInt(year), i, 1), 'MMM', { locale: ptBR });
      monthlyData[i] = { month: monthStr.toUpperCase(), canceladas: 0, total: 0, taxa: 0 };
    }

    aulas.forEach(a => {
      if (!a.data_hora) return;
      const date = parseISO(a.data_hora);
      if (date.getFullYear().toString() === year) {
        const month = date.getMonth();
        monthlyData[month].total += 1;
        if (a.status === 'cancelada') {
          monthlyData[month].canceladas += 1;
        }
      }
    });

    return Object.values(monthlyData).map(m => ({
      ...m,
      taxa: m.total > 0 ? Number(((m.canceladas / m.total) * 100).toFixed(1)) : 0
    }));
  }, [aulas, year]);

  const handleExportCSV = () => {
    exportToCSV(data, `taxa_cancelamento_${year}`, [
      { key: 'month', label: 'Mês' },
      { key: 'total', label: 'Total Agendado' },
      { key: 'canceladas', label: 'Canceladas' },
      { key: 'taxa', label: 'Taxa Cancelamento (%)' },
    ]);
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Carregando dados...</div>;

  return (
    <div className="p-6 print-area bg-slate-900 text-slate-100 min-h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Taxa de Cancelamento de Aulas</h2>
          <p className="text-slate-400">Percentual de aulas canceladas por mês</p>
        </div>
        <div className="flex gap-3 no-print">
          <select 
            value={year} 
            onChange={e => setYear(e.target.value)}
            className="bg-slate-800 border-slate-700 rounded-md px-3 py-2 text-sm"
          >
            {[2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
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
          <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" tickFormatter={(value) => `${value}%`} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
              formatter={(value: number) => `${value}%`}
            />
            <Legend />
            <Line type="monotone" dataKey="taxa" name="Taxa de Cancelamento" stroke="#ef4444" strokeWidth={3} activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto border border-slate-800 rounded-lg">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-800/50 text-slate-300">
            <tr>
              <th className="px-4 py-3 font-medium">Mês</th>
              <th className="px-4 py-3 font-medium text-center">Aulas Agendadas</th>
              <th className="px-4 py-3 font-medium text-center">Aulas Canceladas</th>
              <th className="px-4 py-3 font-medium text-right">Taxa de Cancelamento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {data.map(row => (
              <tr key={row.month} className="hover:bg-slate-800/20">
                <td className="px-4 py-3 text-slate-200">{row.month}</td>
                <td className="px-4 py-3 text-center text-slate-300">{row.total}</td>
                <td className="px-4 py-3 text-center text-red-400">{row.canceladas}</td>
                <td className="px-4 py-3 text-right font-medium text-slate-200">{row.taxa}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="print-footer" data-date={new Date().toLocaleDateString('pt-BR')} />
    </div>
  );
}
