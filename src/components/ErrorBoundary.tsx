import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      const msg = this.state.error?.message || '';
      if (
        msg.includes('insertBefore') ||
        msg.includes('removeChild') ||
        msg.includes('Node')
      ) {
        // Auto-reload immediately for translation errors to bypass the crash screen
        try {
          window.location.reload();
        } catch (e) {
          // ignore
        }
        return null;
      }
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 p-8">
          <div className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-rose-500/5 p-8 text-center">
            <p className="text-4xl font-black text-rose-500">!</p>
            <h2 className="mt-3 text-lg font-semibold text-foreground">An unexpected error occurred</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {this.state.error?.message || 'Unknown error'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 rounded-xl bg-rose-500 px-5 py-2 text-sm font-bold text-white hover:bg-rose-400 transition"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
