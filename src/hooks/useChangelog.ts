import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { changelogService, ChangelogEntry } from '../modules/changelog/changelogService';

export function useChangelog(userId?: string) {
  const queryClient = useQueryClient();

  const {
    data: naoLidos = [],
    isLoading: isNaoLidosLoading
  } = useQuery({
    queryKey: ['changelog', 'nao-lidos', userId],
    queryFn: () => changelogService.getNaoLidos(userId!),
    enabled: !!userId,
  });

  const {
    data: historico = [],
    isLoading: isHistoricoLoading
  } = useQuery({
    queryKey: ['changelog', 'historico'],
    queryFn: () => changelogService.getAll(0, 50), // Busca os últimos 50
  });

  const marcarComoLidoMutation = useMutation({
    mutationFn: (changelogIds: string[]) => changelogService.marcarComoLido(changelogIds, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['changelog', 'nao-lidos', userId] });
    },
  });

  return {
    naoLidos,
    totalNaoLidos: naoLidos.length,
    isNaoLidosLoading,
    
    historico,
    isHistoricoLoading,
    
    marcarComoLido: marcarComoLidoMutation.mutateAsync,
    isMarcando: marcarComoLidoMutation.isPending
  };
}
