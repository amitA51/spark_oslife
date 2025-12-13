import React, { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
import { UserProvider } from './UserContext';
import { SettingsProvider } from './SettingsContext';
import { DataProvider } from './DataContext';
import { CalendarProvider } from './CalendarContext';
import { UIProvider } from './UIContext';
import { FocusProvider } from './FocusContext';
import { NavigationProvider } from './NavigationContext';
import { ToastProvider } from './ToastContext'; // <--- החזרנו את זה



export interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <UserProvider>
      <SettingsProvider>
        <DataProvider>
          <FocusProvider>
            <CalendarProvider>
              <UIProvider>
                <NavigationProvider>
                  <ToastProvider>
                    {children}
                    <Toaster
                      position="top-center"
                      toastOptions={{
                        style: {
                          background: 'rgba(15, 15, 26, 0.8)',
                          backdropFilter: 'blur(12px)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: 'var(--text-primary)',
                          borderRadius: '16px',
                          fontSize: '0.9rem',
                          fontFamily: 'var(--font-body)',
                          boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)',
                        },
                        className: 'glass-morphism',
                      }}
                    />
                  </ToastProvider>
                </NavigationProvider>
              </UIProvider>
            </CalendarProvider>
          </FocusProvider>
        </DataProvider>
      </SettingsProvider>
    </UserProvider>
  );
};