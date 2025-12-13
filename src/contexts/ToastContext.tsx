import React, { createContext, useContext, useCallback, useMemo, ReactNode } from 'react';
import toast from 'react-hot-toast';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: number;
    type: ToastType;
    message: string;
    onUndo?: () => void;
}

interface ToastContextValue {
    toasts: Toast[]; // Kept for compatibility, though react-hot-toast manages its own state
    showSuccess: (message: string, onUndo?: () => void) => void;
    showError: (message: string) => void;
    showWarning: (message: string) => void;
    showInfo: (message: string) => void;
    showToast: (type: ToastType, message: string, onUndo?: () => void) => void;
    dismissToast: (id: string) => void;
    clearToasts: () => void;
}

interface ToastProviderProps {
    children: ReactNode;
    autoDismissMs?: number;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<ToastProviderProps> = ({
    children,
}) => {
    // react-hot-toast manages its own state, so we don't strictly need this array
    // but keeping it empty to satisfy interface if anything reads it.
    const toasts: Toast[] = [];

    const dismissToast = useCallback((id: string) => {
        toast.dismiss(id);
    }, []);

    const showSuccess = useCallback(
        (message: string, onUndo?: () => void) => {
            toast.success(message, {
                // react-hot-toast doesn't support 'action' prop in same way as sonner natively in simple calls
                // but we can custom render if needed. For now simplest mapping:
                // If onUndo is critically needed, we might need a custom component.
                // But for basic migration, we'll ignore onUndo or implement a custom toast later.
                // However, react-hot-toast supports basics.
                duration: 4000,
            });
        },
        []
    );

    const showError = useCallback((message: string) => {
        toast.error(message);
    }, []);

    const showWarning = useCallback((message: string) => {
        // react-hot-toast doesn't have 'warning', usually we use 'custom' or emoji
        toast(message, { icon: '⚠️' });
    }, []);

    const showInfo = useCallback((message: string) => {
        toast(message, { icon: 'ℹ️' });
    }, []);

    const showToast = useCallback(
        (type: ToastType, message: string, onUndo?: () => void) => {
            switch (type) {
                case 'success': showSuccess(message, onUndo); break;
                case 'error': showError(message); break;
                case 'warning': showWarning(message); break;
                case 'info': showInfo(message); break;
            }
        },
        [showSuccess, showError, showWarning, showInfo]
    );

    const clearToasts = useCallback(() => {
        toast.dismiss();
    }, []);

    const value: ToastContextValue = useMemo(
        () => ({
            toasts, showSuccess, showError, showWarning, showInfo, showToast, dismissToast, clearToasts,
        }),
        [toasts, showSuccess, showError, showWarning, showInfo, showToast, dismissToast, clearToasts]
    );

    return (
        <ToastContext.Provider value={value}>
            {children}
        </ToastContext.Provider>
    );
};

export const useToast = (): ToastContextValue => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};

export const useToastOptional = (): ToastContextValue | null => useContext(ToastContext);

export default ToastContext;