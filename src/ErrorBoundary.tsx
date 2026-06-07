import React, { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  constructor(props: Props) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({
      errorInfo: errorInfo
    });
    console.error("ErrorBoundary caught an error", error, errorInfo);

    // Identifica erro de carregamento de chunk do Vite (acontece quando há novo deploy e o usuário tenta navegar)
    const isChunkLoadError = 
      error?.message?.includes('Failed to fetch dynamically imported module') || 
      error?.name === 'ChunkLoadError' ||
      error?.message?.includes('Importing a module script failed');
      
    if (isChunkLoadError) {
      const chunkFailedKey = 'vite_chunk_load_error';
      const hasFailedBefore = sessionStorage.getItem(chunkFailedKey);
      
      // Se não falhou recentemente, tenta recarregar a página para puxar os novos arquivos do servidor
      if (!hasFailedBefore) {
        sessionStorage.setItem(chunkFailedKey, 'true');
        // Define um timeout para limpar o storage para permitir futuros reloads se der erro de novo depois de um tempo
        setTimeout(() => sessionStorage.removeItem(chunkFailedKey), 10000);
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      const isChunkLoadError = 
        this.state.error?.message?.includes('Failed to fetch dynamically imported module') || 
        this.state.error?.name === 'ChunkLoadError' ||
        this.state.error?.message?.includes('Importing a module script failed');

      if (isChunkLoadError) {
        return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-4" />
            <h1 className="text-xl font-medium">Atualizando aplicativo...</h1>
            <p className="text-slate-400 mt-2 text-center max-w-md">
              Uma nova versão foi detectada. A página está sendo recarregada para obter os arquivos mais recentes.
            </p>
          </div>
        );
      }

      return (
        <div className="p-5 text-white bg-red-900 min-h-screen">
          <h1>Algo deu errado (Crash detectado)</h1>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            <summary>Ver stack trace</summary>
            {this.state.error?.toString()}
            <br />
            {this.state.errorInfo?.componentStack}
          </details>
        </div>
      );
    }

    return this.props.children as React.ReactElement;
  }
}
