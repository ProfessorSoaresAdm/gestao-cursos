import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMounted } from '@/hooks/use-mounted';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'admin' | 'editor' | 'viewer' | null>(null);
  const [telasAcesso, setTelasAcesso] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useMounted();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (isMountedRef.current) {
          setUser(session?.user ?? null);
        }

        if (session?.user) {
          queueMicrotask(() => {
            fetchRole(session.user.id);
          });
        } else {
          if (isMountedRef.current) {
            setRole(null);
            setTelasAcesso([]);
            setLoading(false);
          }
        }
      }
    );

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (isMountedRef.current) {
        setUser(user ?? null);
        if (!user) {
          setLoading(false);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchRole(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, telas_acesso')
        .eq('id', userId)
        .single();

      if (isMountedRef.current) {
        if (!error && data) {
          setRole(data.role as 'admin' | 'editor' | 'viewer');
          setTelasAcesso(data.telas_acesso || []);
        }
        setLoading(false);
      }
    } catch {
      if (isMountedRef.current) setLoading(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return { user, role, telasAcesso, loading, signOut };
}
