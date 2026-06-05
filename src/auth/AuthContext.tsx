import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export interface AuthContextType {
  user: User | null;
  role: 'admin' | 'editor' | 'viewer' | null;
  telasAcesso: string[];
  ativo: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  telasAcesso: [],
  ativo: true,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'admin' | 'editor' | 'viewer' | null>(null);
  const [telasAcesso, setTelasAcesso] = useState<string[]>([]);
  const [ativo, setAtivo] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchProfile(userId: string) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role, telas_acesso, ativo')
          .eq('id', userId)
          .single();

        if (mounted) {
          if (!error && data) {
            setRole(data.role as 'admin' | 'editor' | 'viewer');
            setTelasAcesso(data.telas_acesso || []);
            setAtivo(data.ativo !== false);
          }
          // loading só vira false AQUI, depois do perfil carregado
          setLoading(false);
        }
      } catch {
        if (mounted) setLoading(false);
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (session?.user) {
          // Manter loading=true enquanto busca o perfil
          setUser(session.user);
          setLoading(true);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setRole(null);
          setTelasAcesso([]);
          setAtivo(true);
          setLoading(false);
        }
      }
    );

    // Verificar sessão existente na inicialização
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        // loading continua true — fetchProfile vai completar via onAuthStateChange
      } else {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, role, telasAcesso, ativo, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
