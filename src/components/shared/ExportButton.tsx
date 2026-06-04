import React from 'react';
import Papa from 'papaparse';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExportButtonProps {
  data: any[];
  filename: string;
  className?: string;
}

export function ExportButton({ data, filename, className }: ExportButtonProps) {
  const handleExport = () => {
    if (!data || data.length === 0) {
      alert("Não há dados para exportar.");
      return;
    }

    const csv = Papa.unparse(data, {
      quotes: true,
      delimiter: ",",
      header: true,
    });

    // Add BOM for Excel compatibility with UTF-8
    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
