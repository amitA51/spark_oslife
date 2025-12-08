import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import type { User } from '../../types';
import { subscribeToAuthChanges } from '../../services/authService';
import { auth } from '../../config/firebase';
import { signOut } from 'firebase/auth';

export interface UserContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  enableGuestMode: () => void;
  disableGuestMode: () => void;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export interface UserProviderProps {
  children: ReactNode;
}

const GUEST_KEY = 'isGuest';

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(() => !!localStorage.getItem(GUEST_KEY));

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    try {
      unsubscribe = subscribeToAuthChanges(firebaseUser => {
        if (firebaseUser) {
          const mappedUser: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
            createdAt: firebaseUser.metadata?.creationTime || new Date().toISOString(),
          };
          setUser(mappedUser);
        } else {
          setUser(null);
        }
      });
    } catch (error) {
      console.error('Firebase auth error:', error);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const enableGuestMode = useCallback(() => {
    setIsGuest(true);
    localStorage.setItem(GUEST_KEY, 'true');
  }, []);

  const disableGuestMode = useCallback(() => {
    setIsGuest(false);
    localStorage.removeItem(GUEST_KEY);
  }, []);

  const logout = useCallback(async () => {
    disableGuestMode();
    try {
      if (auth) {
        await signOut(auth);
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [disableGuestMode]);

  const value = useMemo<UserContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isGuest,
      enableGuestMode,
      disableGuestMode,
      logout,
    }),
    [user, isGuest, enableGuestMode, disableGuestMode, logout]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = (): UserContextValue => {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return ctx;
};
