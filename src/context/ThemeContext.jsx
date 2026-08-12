import { createContext, useContext, useEffect, useMemo } from 'react';

import { SITE_DIR, SITE_LANG } from '@utils/constants.js';

const ThemeContext = createContext(null);

/**
 * Owns `data-theme`, `lang` and `dir` on <html>.
 *
 * Bedar is DARK-ONLY, everywhere. The marketing site always rendered
 * dark (it pins `data-theme="dark"` on its own shell — see
 * PublicLayout), and the dashboard now matches it: the old light/dark
 * toggle was removed by request, so there is no light path and nothing
 * to persist. `data-theme="dark"` is asserted here so the whole
 * document — public site and dashboard alike — is dark from first
 * paint, and nothing can drift it.
 */
export function ThemeProvider({ children }) {
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', 'dark');
    root.setAttribute('lang', SITE_LANG);
    root.setAttribute('dir', SITE_DIR);
  }, []);

  // Kept as a context so `useTheme` consumers keep working, but the
  // value is fixed: there is no toggle any more.
  const value = useMemo(() => ({ theme: 'dark', isDark: true }), []);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside <ThemeProvider>');
  return context;
}

export default ThemeContext;
