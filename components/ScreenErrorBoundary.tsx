import { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshIcon } from './icons';

interface Props {
    children: ReactNode;
    screenName: string;
    onRetry?: () => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Screen-level error boundary that provides a more elegant fallback
 * than the global ErrorBoundary, allowing the app to continue running
 * while offering recovery options for the specific screen.
 */
class ScreenErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(`Error in ${this.props.screenName}:`, error, errorInfo);
        // Could log to analytics here
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: null });
        this.props.onRetry?.();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center" dir="rtl">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/10 flex items-center justify-center mb-6 border border-red-500/20">
                        <span className="text-4xl">⚠️</span>
                    </div>

                    <h2 className="text-xl font-bold text-white mb-2">
                        שגיאה בטעינת {this.props.screenName}
                    </h2>
                    <p className="text-[var(--text-secondary)] text-sm mb-6 max-w-xs">
                        משהו השתבש. נסה לרענן או לחזור למסך הראשי.
                    </p>

                    {import.meta.env.DEV && this.state.error && (
                        <div className="mb-6 p-3 bg-red-500/10 rounded-lg border border-red-500/20 max-w-md w-full">
                            <p className="text-xs font-mono text-red-400 text-left" dir="ltr">
                                {this.state.error.name}: {this.state.error.message}
                            </p>
                        </div>
                    )}

                    <button
                        onClick={this.handleRetry}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--cosmos-accent-primary)] to-[var(--cosmos-accent-cyan)] text-white rounded-xl font-bold transition-all hover:scale-105 shadow-lg"
                    >
                        <RefreshIcon className="w-5 h-5" />
                        נסה שוב
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ScreenErrorBoundary;
