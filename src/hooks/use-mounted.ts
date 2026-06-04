import { useRef, useEffect } from 'react';

/**
 * Retorna uma ref que é `true` enquanto o componente está montado.
 * Use para evitar setState em componentes desmontados.
 */
export function useMounted() {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return isMountedRef;
}
