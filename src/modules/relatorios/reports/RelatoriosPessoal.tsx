import React, { useMemo } from 'react';
import { usePessoal } from '@/hooks/usePessoal';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import { exportToCSV, formatCurrencyExport } from '@/lib/export';

export default function RelatoriosPessoal() {
  const { pessoal, loading } = usePessoal();

  const { chartData, tableData, totalSalarios } = useMemo(() => {
    let ativos = 0;
    let ferias = 0;
    let afastados = 0;
    let inativos = 0;
    let totalCusto = 0;

    pessoal.forEach(p => {
      if (p.status === 'ativo') ativos++;
      else if (p.status === 'ferias') ferias++;
      else if (p.status === 'afastado') afastados++;
      else if (p.status === 'inativo') inativos++;

      // Só consideramos custo fixo mensal para quem não está inativo
      if (p.status !== 'inativo' && p.salario) {
        totalCusto += p.salario;
      }
    });

    const chart = [
      { name: 'Ativos', quantidade: ativos, fill: '#10b981' },
      { name: 'Férias', quantidade: ferias, fill: '#3b82f6' },
      { name: 'Afastados', quantidade: afastados, fill: '#f59e0b' },
      { name: 'Inativos', quantidade: inativos, fill: '#ef4444' },
    ];

    const table = pessoal.map(p => ({
      nome: p.nome,
      cargo: p.cargo,
      status: p.status,
      salario: p.salario || 0,
      data_admissao: p.data_admissao
    })).sort((a, b) => a.nome.localeCompare(b.nome));

    return { chartData: chart, tableData: table, totalSalarios: totalCusto };
  }, [pessoal]);

  const handleExportCSV = () => {
    exportToCSV(tableData, 'colaboradores_pessoal', [
      { key: 'nome', label: 'Colaborador' },
      { key: 'cargo', label: 'Cargo' },
      { key: 'status', label: 'Status' },
      { key: 'salario', label: 'Custo Fixo Mensal (R$)', format: formatCurrencyExport },
    ]);
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Carregando dados...</div>;

  return (
    <div className="p-6 print-area bg-slate-900 text-slate-100 min-h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Relatório de Pessoal</h2>
          <p className="text-slate-400">Distribuição de colaboradores e custo de folha de pagamento</p>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-1 bg-slate-800/50 border border-slate-700 rounded-xl p-6 flex flex-col justify-center text-center">
          <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">Custo Fixo Mensal (Ativos)</h3>
          <p className="text-4xl font-bold text-indigo-400">{formatCurrencyExport(totalSalarios)}</p>
          <p className="text-slate-500 text-xs mt-2">Soma de salários (exclui inativos)</p>
        </div>
        
        <div className="md:col-span-2 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" allowDecimals={false} />
              <Tooltip 
                cursor={{ fill: '#334155', opacity: 0.4 }}
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
              />
              <Bar dataKey="quantidade" name="Quantidade">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-800 rounded-lg">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-800/50 text-slate-300">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Cargo</th>
              <th className="px-4 py-3 font-medium text-center">Status</th>
              <th className="px-4 py-3 font-medium text-right">Salário Base</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {tableData.map(row => (
              <tr key={row.nome} className={`hover:bg-slate-800/20 ${row.status === 'inativo' ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3 font-medium text-slate-200">{row.nome}</td>
                <td className="px-4 py-3 text-slate-300">{row.cargo}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                    row.status === 'ativo' ? 'bg-emerald-500/10 text-emerald-400' :
                    row.status === 'ferias' ? 'bg-blue-500/10 text-blue-400' :
                    row.status === 'afastado' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-red-500/10 text-red-400'
                  }`}>
                    {row.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-slate-300">{formatCurrencyExport(row.salario)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="print-footer" data-date={new Date().toLocaleDateString('pt-BR')} />
    </div>
  );
}
