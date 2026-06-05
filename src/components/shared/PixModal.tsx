import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Copy, Download, QrCode } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { gerarPixPayload, PixTipo } from '@/lib/pixUtils';

interface PixModalProps {
  professor: { nome: string; pix_tipo: string; pix_chave: string; cidade?: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PixModal({ professor, open, onOpenChange }: PixModalProps) {
  const [valorDigitado, setValorDigitado] = useState<string>('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [payloadStr, setPayloadStr] = useState<string>('');

  useEffect(() => {
    if (!open || !professor) {
      setValorDigitado('');
      return;
    }

    const valor = parseFloat(valorDigitado) > 0 ? parseFloat(valorDigitado) : undefined;
    
    try {
      const p = gerarPixPayload({
        chave: professor.pix_chave,
        tipo: professor.pix_tipo as PixTipo,
        nomeRecebedor: professor.nome,
        cidadeRecebedor: professor.cidade || 'SAO PAULO',
        valor: valor,
        txid: 'PAGAMENTO'
      });
      setPayloadStr(p);

      QRCode.toDataURL(p, { width: 256, margin: 2 }, (err, url) => {
        if (!err) setQrCodeDataUrl(url);
      });
    } catch (err) {
      console.error('Erro ao gerar PIX:', err);
    }
  }, [open, professor, valorDigitado]);

  const handleCopy = () => {
    navigator.clipboard.writeText(payloadStr);
    toast.success('Código PIX copiado!');
  };

  if (!professor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-slate-950 text-slate-100 border-slate-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-emerald-400" /> PIX — {professor.nome}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Abra o app do seu banco, vá em PIX, Pagar e escaneie o QR Code ou cole o código.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 flex flex-col items-center">
          <div className="w-full space-y-2">
            <Label htmlFor="valor">Valor opcional (R$)</Label>
            <Input 
              id="valor"
              type="number"
              min="0"
              step="0.01"
              value={valorDigitado}
              onChange={(e) => setValorDigitado(e.target.value)}
              placeholder="Ex: 50.00"
              className="bg-slate-900 border-slate-800 w-full"
            />
          </div>

          <div className="bg-white p-2 rounded-xl flex justify-center items-center h-64 w-64">
            {qrCodeDataUrl ? (
              <img src={qrCodeDataUrl} alt="QR Code do PIX" className="max-w-full max-h-full" />
            ) : (
              <div className="animate-pulse bg-slate-200 w-full h-full rounded-xl" />
            )}
          </div>

          <div className="w-full space-y-2">
            <Label>PIX Copia e Cola</Label>
            <div className="flex items-center gap-2">
              <Input 
                value={payloadStr} 
                readOnly 
                className="bg-slate-900 border-slate-800 text-xs font-mono" 
              />
              <Button onClick={handleCopy} variant="outline" className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="hover:bg-slate-800 text-slate-300 w-full sm:w-auto">
            Fechar
          </Button>
          <a 
            href={qrCodeDataUrl} 
            download={`pix-${professor.nome.replace(/\s+/g, '-').toLowerCase()}.png`}
            className={cn(buttonVariants(), "bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto cursor-pointer flex items-center justify-center")}
          >
            <Download className="w-4 h-4 mr-2" /> Baixar QR Code
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
