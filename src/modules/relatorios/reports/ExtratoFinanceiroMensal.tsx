import React, { useMemo, useState } from 'react';
import { usePagamentos } from '@/hooks/usePagamentos';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import { exportToCSV, formatCurrencyExport } from '@/lib/export';

export default function ExtratoFinanceiroMensal() {
  const { pagamentos, loading } = usePagamentos();
  const [year, setYear] = useState(new Date().getFullYear().toString());

  const data = useMemo(() => {
    const monthlyData: Record<string, { month: string; receitas: number; despesas: number }> = {};
    
    // Inicializa 12 meses
    for (let i = 0; i < 12; i++) {
      const monthStr = format(new Date(parseInt(year), i, 1), 'MMM', { locale: ptBR });
      monthlyData[i] = { month: monthStr.toUpperCase(), receitas: 0, despesas: 0 };
    }

    pagamentos.forEach(p => {
      if (p.status !== 'pago' || !p.data_pagamento) return;
      const date = parseISO(p.data_pagamento);
      if (date.getFullYear().toString() === year) {
        const month = date.getMonth();
        // Assumindo que pagamentos a professores são despesas.
        monthlyData[month].despesas += p.valor;
      }
    });

    return Object.values(monthlyData);
  }, [pagamentos, year]);

  const handleExportCSV = () => {
    exportToCSV(data, `extrato_financeiro_${year}`, [
      { key: 'month', label: 'Mês' },
      { key: 'receitas', label: 'Receitas (R$)', format: formatCurrencyExport },
      { key: 'despesas', label: 'Despesas (R$)', format: formatCurrencyExport },
    ]);
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Carregando dados...</div>;

  return (
    <div className="p-6 print-area bg-slate-900 text-slate-100 min-h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Extrato Financeiro Mensal</h2>
          <p className="text-slate-400">Receitas e Despesas consolidadas por mês</p>
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
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" tickFormatter={(value) => `R$ ${value}`} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
              formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
            />
            <Legend />
            <Bar dataKey="receitas" name="Receitas" fill="#10b981" />
            <Bar dataKey="despesas" name="Despesas" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto border border-slate-800 rounded-lg">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-800/50 text-slate-300">
            <tr>
              <th className="px-4 py-3 font-medium">Mês</th>
              <th className="px-4 py-3 font-medium text-right">Receitas</th>
              <th className="px-4 py-3 font-medium text-right">Despesas</th>
              <th className="px-4 py-3 font-medium text-right">Saldo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {data.map(row => (
              <tr key={row.month} className="hover:bg-slate-800/20">
                <td className="px-4 py-3">{row.month}</td>
                <td className="px-4 py-3 text-right text-emerald-400">{formatCurrencyExport(row.receitas)}</td>
                <td className="px-4 py-3 text-right text-red-400">{formatCurrencyExport(row.despesas)}</td>
                <td className="px-4 py-3 text-right font-medium text-slate-300">{formatCurrencyExport(row.receitas - row.despesas)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="print-footer" data-date={new Date().toLocaleDateString('pt-BR')} />
    </div>
  );
}
