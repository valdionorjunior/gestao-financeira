import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark';

interface ThemeStore {
  isDark: boolean;
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      isDark: false,
      theme: 'light',
      
      toggleTheme: () => set((state) => ({
        isDark: !state.isDark,
        theme: state.isDark ? 'light' : 'dark',
      })),
      
      setTheme: (theme: Theme) => set({
        theme,
        isDark: theme === 'dark',
      }),
    }),
    {
      name: 'theme-store',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
