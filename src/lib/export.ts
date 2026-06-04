import Papa from 'papaparse';
import { format, parseISO } from 'date-fns';

export interface ColumnMapping {
  key: string;
  label: string;
  format?: (value: any, row?: any) => any;
}

export const formatCurrencyExport = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '';
  // Format to standard BRL format without the R$ symbol in CSV is sometimes preferred,
  // but the prompt explicitly requested "R$ X.XXX,XX"
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export const formatDateExport = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return format(d, 'dd/MM/yyyy');
  } catch (e) {
    return '';
  }
};

export const exportToCSV = (data: any[], filename: string, columns?: ColumnMapping[]) => {
  if (!data || data.length === 0) {
    alert("Não há dados para exportar.");
    return;
  }

  // Se houver mapeamento de colunas, reestruturamos os dados
  let exportData = data;
  if (columns && columns.length > 0) {
    exportData = data.map(row => {
      const newRow: Record<string, any> = {};
      columns.forEach(col => {
        // Resolve nested keys like 'professores.nome'
        const keys = col.key.split('.');
        let value = row;
        for (const k of keys) {
          if (value) value = value[k];
          else break;
        }

        if (col.format) {
          newRow[col.label] = col.format(value, row);
        } else {
          newRow[col.label] = value;
        }
      });
      return newRow;
    });
  }

  const csv = Papa.unparse(exportData, {
    quotes: true,
    delimiter: ";", // Better for Excel in pt-BR
    header: true,
  });

  // Add BOM for Excel compatibility with UTF-8
  const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
