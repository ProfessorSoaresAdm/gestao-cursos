import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Database } from '@/types/database';

type Professor = Database['public']['Tables']['professores']['Row'];

const schema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido').or(z.literal('')).optional().transform(v => v === '' ? null : v),
  telefone: z.string().optional().nullable(),
  especialidade: z.string().optional().nullable(),
  documento: z.string().optional().nullable(),
  endereco: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

interface ProfessorFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professor?: Professor | null;
  onSubmit: (data: any) => Promise<void>;
}

export function ProfessorForm({ open, onOpenChange, professor, onSubmit }: ProfessorFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: '',
      email: '',
      telefone: '',
      especialidade: '',
      documento: '',
      endereco: '',
      observacoes: '',
    }
  });

  useEffect(() => {
    if (open) {
      if (professor) {
        reset({
          nome: professor.nome,
          email: professor.email || '',
          telefone: professor.telefone || '',
          especialidade: professor.especialidade || '',
          documento: professor.documento || '',
          endereco: professor.endereco || '',
          observacoes: professor.observacoes || '',
        });
      } else {
        reset({
          nome: '',
          email: '',
          telefone: '',
          especialidade: '',
          documento: '',
          endereco: '',
          observacoes: '',
        });
      }
    }
  }, [open, professor, reset]);

  const handleFormSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
      alert(`Erro ao salvar: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-slate-950 text-slate-100 border-slate-800">
        <DialogHeader>
          <DialogTitle>{professor ? 'Editar Professor' : 'Novo Professor'}</DialogTitle>
          <DialogDescription className="text-slate-400">
            Preencha os dados do professor abaixo. Campos marcados com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input id="nome" {...register('nome')} placeholder="Ex: João da Silva" className="bg-slate-900 border-slate-800" />
            {errors.nome && <p className="text-sm text-red-500">{errors.nome.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" {...register('email')} placeholder="Ex: joao@email.com" className="bg-slate-900 border-slate-800" />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" {...register('telefone')} placeholder="Ex: (11) 99999-9999" className="bg-slate-900 border-slate-800" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="especialidade">Especialidade</Label>
              <Input id="especialidade" {...register('especialidade')} placeholder="Ex: Matemática" className="bg-slate-900 border-slate-800" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="documento">Documento (CPF)</Label>
              <Input id="documento" {...register('documento')} placeholder="000.000.000-00" className="bg-slate-900 border-slate-800" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço</Label>
            <Input id="endereco" {...register('endereco')} placeholder="Ex: Rua A, 123" className="bg-slate-900 border-slate-800" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea id="observacoes" {...register('observacoes')} placeholder="Notas adicionais" className="resize-none bg-slate-900 border-slate-800" />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="hover:bg-slate-800 text-slate-300">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
