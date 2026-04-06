import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AppRouter from './router/AppRouter';
import { CommandPalette } from './components/CommandPalette';

import { useAppSelector } from './hooks/useRedux';

const App: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);

  React.useEffect(() => {
    // Dynamic Branding Injection
    const primaryColor = user?.company?.settings?.primaryColor;
    if (primaryColor) {
      document.documentElement.style.setProperty('--primary-color', primaryColor);
      document.documentElement.style.setProperty('--theme-primary', primaryColor);
    }
  }, [user]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#363636',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            fontSize: '14px',
          },
        }}
      />
      <CommandPalette />
      <AppRouter />
    </BrowserRouter>
  );
};

export default App;
