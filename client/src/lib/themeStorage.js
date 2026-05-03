/** Keep in sync with the inline script in `index.html` (first-paint theme). */
export const THEME_STORAGE_KEY = 'ca_tracker_theme';

/** No saved value → dark (default). Explicit `light` / `dark` only. */
export function getInitialIsDark() {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v === 'light') return false;
    if (v === 'dark') return true;
    return true;
  } catch {
    return true;
  }
}

export function persistThemePreference(isDark) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
  } catch {
    /* private mode / quota */
  }
}
