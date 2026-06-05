import React, { useMemo } from 'react';
import { useUsuarios } from '@/hooks/useUsuarios';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import { exportToCSV } from '@/lib/export';
import { format, parseISO } from 'date-fns';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6'];

export default function AuditoriaAcessos() {
  const { usuarios, loading } = useUsuarios();

  const { chartData, tableData } = useMemo(() => {
    let admin = 0;
    let editor = 0;
    let viewer = 0;

    usuarios.forEach(u => {
      if (u.role === 'admin') admin++;
      else if (u.role === 'editor') editor++;
      else viewer++;
    });

    const chart = [
      { name: 'Administradores', value: admin },
      { name: 'Editores', value: editor },
      { name: 'Visualizadores', value: viewer },
    ].filter(item => item.value > 0);

    const table = [...usuarios].sort((a, b) => {
      // sort by role priority then name
      const roleWeight = { admin: 1, editor: 2, viewer: 3 };
      if (roleWeight[a.role as keyof typeof roleWeight] !== roleWeight[b.role as keyof typeof roleWeight]) {
        return roleWeight[a.role as keyof typeof roleWeight] - roleWeight[b.role as keyof typeof roleWeight];
      }
      return a.nome.localeCompare(b.nome);
    });

    return { chartData: chart, tableData: table };
  }, [usuarios]);

  const handleExportCSV = () => {
    exportToCSV(tableData, 'auditoria_acessos', [
      { key: 'nome', label: 'Nome' },
      { key: 'email', label: 'E-mail' },
      { key: 'role', label: 'Nível de Acesso' },
      { key: 'ativo', label: 'Status Ativo' },
      { key: 'created_at', label: 'Data de Criação', format: (v) => v ? format(parseISO(v), 'dd/MM/yyyy HH:mm') : '-' },
    ]);
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Carregando dados...</div>;

  return (
    <div className="p-6 print-area bg-slate-900 text-slate-100 min-h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Auditoria de Acessos</h2>
          <p className="text-slate-400">Usuários cadastrados, roles e informações de conta</p>
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
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto border border-slate-800 rounded-lg">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-800/50 text-slate-300">
            <tr>
              <th className="px-4 py-3 font-medium">Usuário</th>
              <th className="px-4 py-3 font-medium">E-mail</th>
              <th className="px-4 py-3 font-medium text-center">Nível</th>
              <th className="px-4 py-3 font-medium text-center">Status</th>
              <th className="px-4 py-3 font-medium text-right">Criado em</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {tableData.map(row => (
              <tr key={row.id} className={`hover:bg-slate-800/20 ${!row.ativo ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3 font-medium text-slate-200">{row.nome}</td>
                <td className="px-4 py-3 text-slate-400">{row.email}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs uppercase ${
                    row.role === 'admin' ? 'bg-emerald-500/20 text-emerald-400' :
                    row.role === 'editor' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-slate-700 text-slate-300'
                  }`}>
                    {row.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    row.ativo ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {row.ativo ? 'Ativo' : 'Bloqueado'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-slate-300">
                  {(row as any).created_at ? format(parseISO((row as any).created_at), 'dd/MM/yyyy HH:mm') : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="print-footer" data-date={new Date().toLocaleDateString('pt-BR')} />
    </div>
  );
}
