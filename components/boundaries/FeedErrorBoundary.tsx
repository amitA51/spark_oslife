import React, { Component, ReactNode } from 'react';
import ErrorFallback from './ErrorFallback';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * FeedErrorBoundary
 *
 * Error boundary that wraps the Feed screen.
 * Catches and handles errors without crashing the entire app.
 */
class FeedErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console
    console.error('Feed Error Boundary caught an error:', error, errorInfo);

    // TODO: Send to error tracking service (e.g., Sentry)
    // trackError('Feed', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <ErrorFallback error={this.state.error} resetError={this.resetError} featureName="פיד" />
      );
    }

    return this.props.children;
  }
}

export default FeedErrorBoundary;
