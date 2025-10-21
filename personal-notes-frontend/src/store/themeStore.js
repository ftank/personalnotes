import { create } from 'zustand';
import api from '../services/api';

const THEME_STORAGE_KEY = 'personal-notes-theme';

const useThemeStore = create((set, get) => ({
  // State
  theme: 'system', // 'light' | 'dark' | 'system'
  actualTheme: 'light', // The actual applied theme ('light' or 'dark')

  // Actions

  /**
   * Initialize theme from localStorage and system preference
   */
  initTheme: () => {
    console.log('[ThemeStore] Initializing theme...');

    // Get saved preference
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'light';
    console.log('[ThemeStore] Saved theme:', savedTheme);

    // Apply theme immediately
    get().setTheme(savedTheme, false);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      if (get().theme === 'system') {
        get().applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  },

  /**
   * Set theme preference
   * @param {string} theme - 'light' | 'dark' | 'system'
   * @param {boolean} sync - Whether to sync with backend
   */
  setTheme: (theme, sync = true) => {
    console.log('[ThemeStore] setTheme called with:', theme, 'sync:', sync);
    set({ theme });

    // Save to localStorage
    localStorage.setItem(THEME_STORAGE_KEY, theme);

    // Determine actual theme to apply
    let actualTheme = theme;
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      actualTheme = isDark ? 'dark' : 'light';
    }

    get().applyTheme(actualTheme);

    // Sync with backend if requested
    if (sync) {
      get().syncWithBackend(theme);
    }
  },

  /**
   * Apply theme to DOM
   * @param {string} theme - 'light' or 'dark'
   */
  applyTheme: (theme) => {
    console.log('[ThemeStore] Applying theme to DOM:', theme);
    set({ actualTheme: theme });

    const html = document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark');
      console.log('[ThemeStore] Added "dark" class to <html>');
    } else {
      html.classList.remove('dark');
      console.log('[ThemeStore] Removed "dark" class from <html>');
    }
    console.log('[ThemeStore] Current html classes:', html.className);
  },

  /**
   * Sync theme preference with backend
   * @param {string} theme - Theme to sync
   */
  syncWithBackend: async (theme) => {
    try {
      await api.patch('/api/user/theme', { theme });
      console.log('Theme synced with backend:', theme);
    } catch (error) {
      console.error('Error syncing theme with backend:', error);
      // Don't block UI if backend sync fails
    }
  },

  /**
   * Load theme from backend (called after login)
   */
  loadFromBackend: async () => {
    try {
      const response = await api.get('/api/user/profile');
      const backendTheme = response.data.theme_preference;

      if (backendTheme && backendTheme !== get().theme) {
        console.log('Loading theme from backend:', backendTheme);
        get().setTheme(backendTheme, false);
      }
    } catch (error) {
      console.error('Error loading theme from backend:', error);
      // Use local theme if backend fails
    }
  },

  /**
   * Toggle between light and dark (skip system)
   */
  toggleTheme: () => {
    const currentActual = get().actualTheme;
    const newTheme = currentActual === 'dark' ? 'light' : 'dark';
    get().setTheme(newTheme);
  },
}));

export default useThemeStore;
