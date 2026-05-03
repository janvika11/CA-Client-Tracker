import { create } from 'zustand';
import { DEFAULT_SELECT_FY } from '../lib/constants';
import { getInitialIsDark, persistThemePreference } from '../lib/themeStorage';

export const useUIStore = create((set) => ({
  currentFY: DEFAULT_SELECT_FY,
  density: 'comfortable',
  isDark: getInitialIsDark(),
  searchOpen: false,
  setFY: (fy) => set({ currentFY: fy }),
  toggleDensity: () =>
    set((state) => ({ density: state.density === 'comfortable' ? 'compact' : 'comfortable' })),
  toggleDark: () =>
    set((state) => {
      const isDark = !state.isDark;
      persistThemePreference(isDark);
      return { isDark };
    }),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
}));
