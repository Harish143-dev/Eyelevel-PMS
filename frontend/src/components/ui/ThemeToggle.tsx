import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../store/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg transition-colors duration-200 hover:bg-surface/10 flex items-center justify-center border border-border bg-surface"
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-text-main" />
      ) : (
        <Sun className="w-5 h-5 text-text-main" />
      )}
    </button>
  );
};
