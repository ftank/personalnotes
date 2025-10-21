// This script runs BEFORE React initializes to prevent flash of wrong theme
(function() {
  const THEME_STORAGE_KEY = 'personal-notes-theme';

  function applyTheme() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'light';
    const html = document.documentElement;

    let actualTheme = savedTheme;

    // Handle system preference
    if (savedTheme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      actualTheme = isDark ? 'dark' : 'light';
    }

    // Apply theme immediately
    if (actualTheme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }

    console.log('[Theme Init] Applied theme:', actualTheme);
  }

  // Run immediately
  applyTheme();
})();
