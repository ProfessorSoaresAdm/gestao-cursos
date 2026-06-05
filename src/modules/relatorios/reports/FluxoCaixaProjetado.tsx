import React, { useMemo } from 'react';
import { usePagamentos } from '@/hooks/usePagamentos';
import { addDays, isBefore, isAfter, startOfDay, parseISO } from 'date-fns';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import { exportToCSV, formatCurrencyExport } from '@/lib/export';

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'];

export default function FluxoCaixaProjetado() {
  const { pagamentos, loading } = usePagamentos();

  const data = useMemo(() => {
    const today = startOfDay(new Date());
    const days30 = addDays(today, 30);
    const days60 = addDays(today, 60);
    const days90 = addDays(today, 90);

    const caixas = {
      atrasados: 0,
      emAte30: 0,
      emAte60: 0,
      emAte90: 0,
    };

    pagamentos.forEach(p => {
      if (p.status === 'pago') return;
      
      const vencimento = startOfDay(parseISO(p.data_vencimento));

      if (isBefore(vencimento, today)) {
        caixas.atrasados += p.valor;
      } else if (!isAfter(vencimento, days30)) {
        caixas.emAte30 += p.valor;
      } else if (!isAfter(vencimento, days60)) {
        caixas.emAte60 += p.valor;
      } else if (!isAfter(vencimento, days90)) {
        caixas.emAte90 += p.valor;
      }
    });

    return [
      { name: 'Atrasados', valor: caixas.atrasados },
      { name: 'Próximos 30 dias', valor: caixas.emAte30 },
      { name: '31 a 60 dias', valor: caixas.emAte60 },
      { name: '61 a 90 dias', valor: caixas.emAte90 },
    ];
  }, [pagamentos]);

  const handleExportCSV = () => {
    exportToCSV(data, 'fluxo_caixa_projetado', [
      { key: 'name', label: 'Período' },
      { key: 'valor', label: 'Valor Projetado (R$)', format: formatCurrencyExport },
    ]);
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Carregando dados...</div>;

  return (
    <div className="p-6 print-area bg-slate-900 text-slate-100 min-h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Fluxo de Caixa Projetado</h2>
          <p className="text-slate-400">Pagamentos pendentes (Saídas) nos próximos 90 dias</p>
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
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
              outerRadius={120}
              fill="#8884d8"
              dataKey="valor"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => formatCurrencyExport(value)} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto border border-slate-800 rounded-lg">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-800/50 text-slate-300">
            <tr>
              <th className="px-4 py-3 font-medium">Período de Vencimento</th>
              <th className="px-4 py-3 font-medium text-right">Saídas Projetadas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {data.map((row, idx) => (
              <tr key={row.name} className="hover:bg-slate-800/20">
                <td className="px-4 py-3 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }}></span>
                  <span className="text-slate-200">{row.name}</span>
                </td>
                <td className="px-4 py-3 text-right font-medium text-slate-200">{formatCurrencyExport(row.valor)}</td>
              </tr>
            ))}
            <tr className="bg-slate-800/40">
              <td className="px-4 py-3 font-bold text-slate-200">Total Projetado (90 dias)</td>
              <td className="px-4 py-3 text-right font-bold text-white">
                {formatCurrencyExport(data.reduce((acc, curr) => acc + curr.valor, 0))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="print-footer" data-date={new Date().toLocaleDateString('pt-BR')} />
    </div>
  );
}
