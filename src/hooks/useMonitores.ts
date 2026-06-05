import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useMonitores() {
  const { data: monitores = [], isLoading } = useQuery({
    queryKey: ['monitores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome, email')
        .in('role', ['admin','editor'])
        .eq('ativo', true)
        .order('nome');
      
      if (error) throw new Error(error.message);
      return data ?? [];
    }
  });

  return { monitores, isLoading };
}
