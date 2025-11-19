import { useState, useEffect } from 'react';

export const usePwaUpdate = () => {
    const [updateAvailable, setUpdateAvailable] = useState<ServiceWorker | null>(null);

    useEffect(() => {
        const registerListeners = async () => {
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.ready;
                if (registration.waiting) {
                    setUpdateAvailable(registration.waiting);
                }
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                setUpdateAvailable(newWorker);
                            }
                        });
                    }
                });
            }
        };
        registerListeners();
    }, []);

    const handleUpdate = () => {
        if (updateAvailable) {
            updateAvailable.postMessage({ type: 'SKIP_WAITING' });
            // Page will reload via 'controllerchange' listener in index.tsx
        }
    };

    return { updateAvailable, handleUpdate };
};
