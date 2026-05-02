import { create } from 'zustand';
import { DEFAULT_SELECT_FY } from '../lib/constants';

export const useUIStore = create((set) => ({
  currentFY: DEFAULT_SELECT_FY,
  density: 'comfortable',
  isDark: false,
  searchOpen: false,
  setFY: (fy) => set({ currentFY: fy }),
  toggleDensity: () =>
    set((state) => ({ density: state.density === 'comfortable' ? 'compact' : 'comfortable' })),
  toggleDark: () => set((state) => ({ isDark: !state.isDark })),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
}));
