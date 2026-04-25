/**
 * @deprecated ThemeContext.tsx - Merged into AppContext.tsx
 * 
 * Use: import { useApp } from '@/contexts/AppContext';
 * 
 * Re-exports from AppContext with backward compatibility API mapping.
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useApp } from './AppContext';

const ThemeContext = createContext({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
  setLightTheme: () => {},
  setDarkTheme: () => {},
  setHighContrastTheme: () => {},
  mounted: true,
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const app = useApp();

  // Map AppContext to ThemeContext API
  const value = {
    theme: app.theme,
    setTheme: app.setTheme,
    toggleTheme: app.toggleTheme,
    setLightTheme: app.setLightTheme,
    setDarkTheme: app.setDarkTheme,
    setHighContrastTheme: app.setHighContrastTheme,
    mounted: app.themeMounted,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export default ThemeProvider;