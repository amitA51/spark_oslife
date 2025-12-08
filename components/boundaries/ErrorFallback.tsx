import React from 'react';

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  featureName: string;
}

/**
 * ErrorFallback Component
 *
 * Shared fallback UI displayed when an error boundary catches an error.
 * Provides user-friendly error message and option to retry.
 */
const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError, featureName }) => {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <div className="max-w-md w-full themed-card p-6 text-center space-y-4">
        {/* Error Icon */}
        <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Error Message */}
        <div>
          <h3 className="text-lg font-semibold text-red-400 mb-2">שגיאה ב{featureName}</h3>
          <p className="text-sm text-gray-400">
            משהו השתבש בטעינת התכונה הזו. שאר האפליקציה ממשיכה לעבוד כרגיל.
          </p>
        </div>

        {/* Error Details (Dev Mode) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-left">
            <details className="text-xs">
              <summary className="cursor-pointer text-gray-500 hover:text-gray-300">
                פרטי שגיאה (מצב פיתוח)
              </summary>
              <pre className="mt-2 p-2 bg-black/20 rounded text-red-400 overflow-auto max-h-32">
                {error.message}
                {'\n\n'}
                {error.stack}
              </pre>
            </details>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={resetError}
            className="px-4 py-2 bg-[var(--accent-gradient)] text-black font-semibold rounded-lg hover:brightness-110 transition-all"
          >
            נסה שוב
          </button>
          <button
            onClick={() => (window.location.href = '/')}
            className="px-4 py-2 glass-panel text-white font-semibold rounded-lg hover:brightness-110 transition-all"
          >
            חזור לבית
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorFallback;
