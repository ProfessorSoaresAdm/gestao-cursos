import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Exibir erro de suspensão vindo do redirect
  const suspendedError = searchParams.get('error') === 'suspended'
    ? 'Sua conta foi suspensa. Entre em contato com o suporte.'
    : null;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setLoading(false);
      // Tratar mensagens específicas do Supabase
      if (error.message.includes('Invalid login credentials')) {
        setError('E-mail ou senha incorretos.');
      } else if (error.message.includes('Email not confirmed')) {
        setError('Confirme seu e-mail antes de fazer login.');
      } else if (error.message.toLowerCase().includes('banned')) {
        setError('Sua conta foi suspensa.');
      } else {
        setError(error.message);
      }
      return;
    }

    // onAuthStateChange no AuthGuard cuida do restante.
    navigate('/', { replace: true });
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-slate-800 border border-slate-700 font-bold p-3 rounded-2xl flex items-center justify-center space-x-2 shadow-lg">
            <span className="text-xl uppercase tracking-wider font-mono text-white">GE</span>
            <span className="border-l border-slate-600 pl-2 text-sm text-indigo-200">Gestão Escolar</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-white">
          Entrar no Sistema
        </h2>
        <p className="mt-2 text-center text-sm text-indigo-300">
          Gerenciador Unificado de Ensino, Pagamentos e Pessoal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800 border border-slate-700 py-8 px-4 sm:px-10 rounded-3xl shadow-2xl">
          {suspendedError && (
            <div className="mb-4 bg-red-500/10 border-l-4 border-red-500 p-3 rounded-r text-sm text-red-200 font-medium">
              {suspendedError}
            </div>
          )}
          {error && (
            <div className="mb-4 bg-red-500/10 border-l-4 border-red-500 p-3 rounded-r text-sm text-red-200 font-medium">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200">Endereço de E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@escola.com"
                required
                className="bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-200">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 h-11"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <LogIn className="w-4 h-4 mr-2" />
              {loading ? 'Entrando...' : 'Acessar Painel'}
            </Button>
          </form>
        </div>
      </div>

      {/* Assinatura do Desenvolvedor */}
      <div className="mt-8 text-center text-sm text-slate-500">
        Desenvolvido por <a href="https://wa.me/5512982176890" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium">AndreSD</a>
      </div>
    </div>
  );
}
