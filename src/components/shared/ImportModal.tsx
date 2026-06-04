import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Download, Upload, FileText, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  instructions: string[];
  expectedColumns: string[];
  onImport: (data: any[]) => Promise<void>;
}

export function ImportModal({
  isOpen,
  onClose,
  title,
  instructions,
  expectedColumns,
  onImport
}: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    const csvContent = expectedColumns.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `template_${title.toLowerCase().replace(/\s+/g, '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      setError('Por favor, selecione um arquivo CSV válido.');
      setFile(null);
      setParsedData([]);
      return;
    }

    setFile(selectedFile);
    setError(null);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError(`Erro na leitura do CSV: ${results.errors[0].message}`);
          return;
        }

        const headers = results.meta.fields || [];
        const missingColumns = expectedColumns.filter(col => !headers.includes(col));
        
        if (missingColumns.length > 0) {
          setError(`O arquivo não contém as colunas obrigatórias: ${missingColumns.join(', ')}`);
          setParsedData([]);
        } else {
          setParsedData(results.data);
        }
      },
      error: (error) => {
        setError(`Erro ao processar o arquivo: ${error.message}`);
      }
    });
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;
    
    setIsProcessing(true);
    setError(null);
    try {
      await onImport(parsedData);
      setFile(null);
      setParsedData([]);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetState = () => {
    if (!isProcessing) {
      setFile(null);
      setParsedData([]);
      setError(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onClose();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && resetState()}>
      <AlertDialogContent className="bg-slate-900 border-slate-800 max-w-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl text-slate-100 flex items-center gap-2">
            <Upload className="w-5 h-5 text-indigo-400" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 mt-4">
              <div className="bg-slate-800/50 p-4 rounded-lg text-slate-300 text-sm">
                <h4 className="font-medium text-slate-200 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Instruções de Importação
                </h4>
                <ul className="list-disc pl-5 space-y-1">
                  {instructions.map((inst, idx) => (
                    <li key={idx}>{inst}</li>
                  ))}
                  <li>Colunas esperadas: <span className="font-mono text-indigo-300 text-xs">{expectedColumns.join(', ')}</span></li>
                </ul>
                <div className="mt-4 flex justify-start">
                  <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200">
                    <Download className="w-4 h-4 mr-2" />
                    Baixar Template CSV
                  </Button>
                </div>
              </div>

              {error && (
                <div className="bg-red-950/30 border border-red-900/50 p-3 rounded-lg flex items-start gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center hover:bg-slate-800/30 transition-colors">
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  disabled={isProcessing}
                />
                <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-8 h-8 text-slate-500" />
                  {file ? (
                    <span className="text-slate-300 font-medium">{file.name}</span>
                  ) : (
                    <span className="text-slate-400">Clique para selecionar um arquivo CSV</span>
                  )}
                </div>
              </div>

              {parsedData.length > 0 && !error && (
                <div className="bg-emerald-950/30 border border-emerald-900/50 p-3 rounded-lg flex items-center gap-2 text-emerald-400 text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{parsedData.length} registro(s) lido(s) com sucesso. Pronto para importar.</span>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="mt-6">
          <AlertDialogCancel 
            disabled={isProcessing}
            className="bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white"
          >
            Cancelar
          </AlertDialogCancel>
          <Button
            onClick={handleImport}
            disabled={parsedData.length === 0 || isProcessing || !!error}
            className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px]"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importando...
              </>
            ) : (
              'Confirmar Importação'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
