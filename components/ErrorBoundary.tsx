import { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshIcon } from './icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
    // Here you would normally log to an error reporting service
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/'; // Reset to home
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] p-4"
          dir="rtl"
        >
          <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-8 max-w-md w-full shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <span className="text-3xl">⚠️</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">משהו השתבש</h2>
              <p className="text-[var(--text-secondary)]">האפליקציה נתקלה בשגיאה לא צפויה.</p>
            </div>

            {/* SECURITY: Only show detailed errors in development mode */}
            {import.meta.env.DEV && this.state.error && (
              <details className="bg-black/30 rounded-lg p-4 text-left border border-red-500/20">
                <summary className="text-xs font-semibold text-red-300 cursor-pointer select-none">
                  פרטים טכניים (מצב פיתוח בלבד)
                </summary>
                <div
                  className="mt-2 overflow-auto max-h-32 text-xs font-mono text-red-300"
                  dir="ltr"
                >
                  <p className="font-bold">{this.state.error.name}: {this.state.error.message}</p>
                  {this.state.errorInfo?.componentStack && (
                    <pre className="mt-2 text-red-400/70 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReload}
                className="w-full py-3 bg-[var(--cosmos-accent-primary)] hover:brightness-110 text-black rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_var(--dynamic-accent-glow)]"
              >
                <RefreshIcon className="w-5 h-5" />
                רענן עמוד
              </button>

              <button
                onClick={this.handleReset}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all border border-white/10"
              >
                חזור לדף הבית
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
