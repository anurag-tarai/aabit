import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'default' | 'matte-teal' | 'matte-charcoal' | 'midnight-purple' | 'light-classic';

interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('os-theme') as Theme;
    return saved || 'matte-charcoal';
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('os-theme', newTheme);
  };

  useEffect(() => {
    const html = document.documentElement;
    html.removeAttribute('data-theme');
    
    if (theme !== 'default') {
      html.setAttribute('data-theme', theme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
