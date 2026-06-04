import React from 'react';
import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  ativo: boolean;
}

export function StatusBadge({ ativo }: StatusBadgeProps) {
  if (ativo) {
    return (
      <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600 text-white border-none">
        Ativo
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="bg-slate-700 hover:bg-slate-800 text-slate-300 border-none">
      Inativo
    </Badge>
  );
}
