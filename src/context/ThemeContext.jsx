import { createContext, useContext, useState, useLayoutEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'scrollio_theme';

function getInitialTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch { /* localStorage may be unavailable (e.g., private browsing) */ }
  // Premium minimal default — light, airy, Apple-like
  return 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useLayoutEffect(() => {
    // Sync attribute on <html> so CSS can use it globally
    // useLayoutEffect runs synchronously before paint, preventing flash
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch { /* ignore quota / privacy-mode write failures */ }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// useTheme intentionally lives with the context it reads; the provider is
// the only component here, so fast refresh is unaffected.
// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
