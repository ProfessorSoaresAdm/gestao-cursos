/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Helper to format Date string (YYYY-MM-DD or YYYY-MM-DDTHH:mm) to dd/mm/aaaa or dd/mm/aaaa hh:mm
export function formatCSVDate(dateStr?: string): string {
  if (!dateStr) return '';
  
  // If date-time (contains 'T')
  if (dateStr.includes('T')) {
    const [datePart, timePart] = dateStr.split('T');
    const [year, month, day] = datePart.split('-');
    return `${day}/${month}/${year} ${timePart}`;
  }
  
  // Just date
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}

// Helper to format currency values to R$ X.XXX,XX
export function formatCSVCurrency(value: number): string {
  if (value === undefined || value === null) return '';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Function to safely wrap CSV fields in quotes to prevent breaking on commas or quotes
function escapeCSVField(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '';
  const text = String(val);
  if (text.includes(',') || text.includes('"') || text.includes('\n') || text.includes(';')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  // Join headers
  const headerLine = headers.map(escapeCSVField).join(',');
  
  // Join rows
  const rowLines = rows.map(row => row.map(escapeCSVField).join(','));
  
  // Combine into CSV string. Prepend UTF-8 BOM so Excel opens with correct encoding
  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
