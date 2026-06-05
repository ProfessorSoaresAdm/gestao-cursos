import React, { useState } from 'react';
import ExtratoFinanceiroMensal from './reports/ExtratoFinanceiroMensal';
import InadimplenciaPorProfessor from './reports/InadimplenciaPorProfessor';
import HistoricoAulasPorProfessor from './reports/HistoricoAulasPorProfessor';
import TaxaCancelamentoAulas from './reports/TaxaCancelamentoAulas';
import CustoPorProfessor from './reports/CustoPorProfessor';
import FluxoCaixaProjetado from './reports/FluxoCaixaProjetado';
import RelatoriosPessoal from './reports/RelatoriosPessoal';
import AuditoriaAcessos from './reports/AuditoriaAcessos';
import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const REPORTS = [
  { id: 'extrato-mensal', label: 'Extrato Financeiro Mensal', Component: ExtratoFinanceiroMensal },
  { id: 'inadimplencia-professor', label: 'Inadimplência por Professor', Component: InadimplenciaPorProfessor },
  { id: 'historico-aulas', label: 'Histórico de Aulas', Component: HistoricoAulasPorProfessor },
  { id: 'taxa-cancelamento', label: 'Taxa de Cancelamento', Component: TaxaCancelamentoAulas },
  { id: 'custo-professor', label: 'Custo Médio por Professor', Component: CustoPorProfessor },
  { id: 'fluxo-caixa', label: 'Fluxo de Caixa Projetado', Component: FluxoCaixaProjetado },
  { id: 'pessoal', label: 'Relatórios de Pessoal', Component: RelatoriosPessoal },
  { id: 'auditoria', label: 'Auditoria de Acessos', Component: AuditoriaAcessos },
];

export default function RelatoriosPage() {
  const [activeReportId, setActiveReportId] = useState(REPORTS[0].id);

  const ActiveComponent = REPORTS.find(r => r.id === activeReportId)?.Component || ExtratoFinanceiroMensal;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="no-print">
        <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-indigo-400" />
          Central de Relatórios
        </h1>
        <p className="text-slate-400 mt-1">Gere análises, exporte planilhas e imprima relatórios.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <aside className="w-full md:w-64 shrink-0 no-print space-y-1">
          {REPORTS.map(report => (
            <button
              key={report.id}
              onClick={() => setActiveReportId(report.id)}
              className={cn(
                "w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                activeReportId === report.id
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800"
              )}
            >
              {report.label}
            </button>
          ))}
        </aside>

        <main className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden min-h-[500px]">
          <ActiveComponent />
        </main>
      </div>
    </div>
  );
}
