import React, { ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children?: ReactNode;
  fallback?: ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
}

// FIX: Switched to `extends React.Component` and a constructor for state to ensure
// the class is correctly identified as a React Component, fixing 'this' context issues.
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  handleRetry = () => {
    // FIX: With the class correctly extending React.Component, 'this.setState' is now available.
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    // FIX: With the class correctly extending React.Component, 'this.state' and 'this.props' are now available.
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'white', border: '1px dashed var(--border-primary)', borderRadius: '1rem', margin: '1rem' }}>
            <h1 className="themed-title">משהו השתבש.</h1>
            <p>אפשר לנסות לרענן את הדף או את הרכיב.</p>
             <button
                onClick={this.handleRetry}
                style={{
                    marginTop: '1.5rem',
                    padding: '0.5rem 1rem',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '9999px',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                }}
            >
                נסה שוב
            </button>
        </div>
      );
    }

    // FIX: With the class correctly extending React.Component, 'this.props' is now available.
    return this.props.children;
  }
}

export default ErrorBoundary;
