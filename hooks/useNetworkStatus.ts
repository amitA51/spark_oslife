import { useState, useEffect, useCallback } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

interface NavigatorConnection extends EventTarget {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  type?: string;
}

declare global {
  interface Navigator {
    connection?: NavigatorConnection;
    mozConnection?: NavigatorConnection;
    webkitConnection?: NavigatorConnection;
  }
}

/**
 * Hook to monitor network connectivity status.
 * Provides real-time updates on online/offline state and connection quality.
 */
export const useNetworkStatus = (): NetworkStatus => {
  const [status, setStatus] = useState<NetworkStatus>(() => ({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    wasOffline: false,
  }));

  const getConnectionInfo = useCallback((): Partial<NetworkStatus> => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (!connection) {
      return {};
    }

    return {
      connectionType: connection.type,
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
    };
  }, []);

  const handleOnline = useCallback(() => {
    setStatus(prev => ({
      ...prev,
      isOnline: true,
      wasOffline: true, // Track that we were offline
      ...getConnectionInfo(),
    }));
  }, [getConnectionInfo]);

  const handleOffline = useCallback(() => {
    setStatus(prev => ({
      ...prev,
      isOnline: false,
      ...getConnectionInfo(),
    }));
  }, [getConnectionInfo]);

  const handleConnectionChange = useCallback(() => {
    setStatus(prev => ({
      ...prev,
      ...getConnectionInfo(),
    }));
  }, [getConnectionInfo]);

  useEffect(() => {
    // Set initial connection info
    setStatus(prev => ({
      ...prev,
      ...getConnectionInfo(),
    }));

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection changes if supported
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, [handleOnline, handleOffline, handleConnectionChange, getConnectionInfo]);

  return status;
};

/**
 * Hook for checking if a specific resource is reachable.
 * Useful for checking API availability beyond just network connectivity.
 */
export const useResourceReachable = (
  url: string,
  checkInterval: number = 30000 // 30 seconds default
): { isReachable: boolean; lastChecked: Date | null; isChecking: boolean } => {
  const [isReachable, setIsReachable] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkReachability = useCallback(async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      setIsReachable(response.ok);
    } catch {
      setIsReachable(false);
    } finally {
      setLastChecked(new Date());
      setIsChecking(false);
    }
  }, [url, isChecking]);

  useEffect(() => {
    // Initial check
    checkReachability();

    // Set up interval for periodic checks
    const intervalId = setInterval(checkReachability, checkInterval);

    return () => clearInterval(intervalId);
  }, [checkReachability, checkInterval]);

  return { isReachable, lastChecked, isChecking };
};

export default useNetworkStatus;