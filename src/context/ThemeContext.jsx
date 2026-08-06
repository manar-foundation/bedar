import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { SITE_DIR, SITE_LANG } from '@utils/constants.js';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'bedar.theme';

function readInitialTheme() {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  // Bedar's default surface is light; dark is opt-in, not
  // system-driven, so the marketing site always renders as designed.
  return 'light';
}

/**
 * Owns `data-theme`, `lang` and `dir` on <html>.
 *
 * `dir="rtl"` / `lang="ar"` are already set in index.html so the very
 * first paint is correct. This re-asserts them because the admin
 * dashboard renders in the same document and nothing should be able
 * to drift them.
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.setAttribute('lang', SITE_LANG);
    root.setAttribute('dir', SITE_DIR);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme, isDark: theme === 'dark' }),
    [theme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside <ThemeProvider>');
  return context;
}

export default ThemeContext;
