import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportToCSV, ColumnMapping } from '@/lib/export';

interface ExportButtonProps {
  data: any[];
  filename: string;
  className?: string;
  columns?: ColumnMapping[];
}

export function ExportButton({ data, filename, className, columns }: ExportButtonProps) {
  const handleExport = () => {
    exportToCSV(data, filename, columns);
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleExport}
      className={className}
      disabled={!data || data.length === 0}
    >
      <Download className="w-4 h-4 mr-2" />
      Exportar CSV
    </Button>
  );
}
