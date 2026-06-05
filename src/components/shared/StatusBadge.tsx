import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AULA_STATUS, getStatusConfig } from '@/types/aulaStatus';

interface StatusBadgeProps {
  ativo?: boolean;
  status?: string;
}

export function StatusBadge({ ativo, status }: StatusBadgeProps) {
  // Trata o caso de status string (Aulas, Pagamentos, etc)
  if (status) {
    const isAulaStatus = AULA_STATUS.some(s => s.value === status.toLowerCase());
    
    if (isAulaStatus) {
      const config = getStatusConfig(status.toLowerCase());
      return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${config.cor}`}>{config.label}</span>;
    }

    switch (status.toLowerCase()) {
      case 'pendente':
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-none">Pendente</Badge>;
      case 'pago':
        return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none">Pago</Badge>;
      case 'atrasado':
        return <Badge className="bg-red-500 hover:bg-red-600 text-white border-none">Atrasado</Badge>;
      default:
        return <Badge className="bg-slate-700 hover:bg-slate-800 text-slate-300 border-none">{status}</Badge>;
    }
  }

  // Trata o caso de ativo boolean (Professores, Pessoal)
  if (ativo === true) {
    return (
      <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none">
        Ativo
      </Badge>
    );
  }

  if (ativo === false) {
    return (
      <Badge className="bg-slate-700 hover:bg-slate-800 text-slate-300 border-none">
        Inativo
      </Badge>
    );
  }

  return null;
}
