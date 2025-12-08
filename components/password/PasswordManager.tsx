import React, { useState, useEffect, useCallback } from 'react';
import * as passwordStore from '../../services/passwordStore';
import LoginScreen from './LoginScreen';
import SetupScreen from './SetupScreen';
import VaultScreen from './VaultScreen';
import type { PasswordItem } from '../../types';
import LoadingSpinner from '../LoadingSpinner';
import useIdleTimer from '../../hooks/useIdleTimer';

const AUTO_LOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutes

interface SessionKeys {
  main: CryptoKey;
  sensitive: CryptoKey;
}

const PasswordManager: React.FC = () => {
  const [vaultExists, setVaultExists] = useState<boolean | null>(null);
  const [decryptedItems, setDecryptedItems] = useState<PasswordItem[] | null>(null);
  const [sessionKeys, setSessionKeys] = useState<SessionKeys | null>(null);

  const checkVault = useCallback(async () => {
    const exists = await passwordStore.hasVault();
    setVaultExists(exists);
  }, []);

  useEffect(() => {
    checkVault();
  }, [checkVault]);

  const handleLock = useCallback(() => {
    setDecryptedItems(null);
    setSessionKeys(null);
  }, []);

  const { state: idleState, timeUntilIdle } = useIdleTimer({
    onIdle: handleLock,
    idleTimeout: AUTO_LOCK_TIMEOUT,
    warningTimeout: 30 * 1000, // Warn 30 seconds before locking
  });

  const handleSetupSuccess = () => {
    setVaultExists(true);
  };

  const handleLoginSuccess = useCallback(
    (items: PasswordItem[], mainKey: CryptoKey, sensitiveKey: CryptoKey) => {
      // Ensure all passwords are strings after decryption
      const fullyDecryptedItems = items.map(item => ({
        ...item,
        password: item.password as string,
      }));
      setDecryptedItems(fullyDecryptedItems);
      setSessionKeys({ main: mainKey, sensitive: sensitiveKey });
    },
    []
  );

  const handleVaultUpdate = (items: PasswordItem[]) => {
    setDecryptedItems(items);
  };

  const handleVaultDeleted = () => {
    handleLock();
    checkVault();
  };

  if (vaultExists === null) {
    return (
      <div className="flex justify-center items-center p-8">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  if (decryptedItems && sessionKeys) {
    return (
      <>
        <VaultScreen
          items={decryptedItems}
          sessionKeys={sessionKeys}
          onLock={handleLock}
          onUpdate={handleVaultUpdate}
          onVaultDeleted={handleVaultDeleted}
        />
        {idleState === 'warning' && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-yellow-500/90 text-black text-sm font-medium rounded-full shadow-lg backdrop-blur animate-pulse">
            Vault locking in {Math.ceil(timeUntilIdle / 1000)}s
          </div>
        )}
      </>
    );
  }

  if (vaultExists) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return <SetupScreen onSetupSuccess={handleSetupSuccess} />;
};

export default PasswordManager;
