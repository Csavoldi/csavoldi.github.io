const STORAGE_KEY = 'site-theme';
const THEME_OPTIONS = new Set(['light', 'dark']);

function readStoredTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    return null;
  }
}

function writeStoredTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch (error) {
    // Ignore storage failures and keep the in-memory theme applied.
  }
}

function getPreferredTheme() {
  const saved = readStoredTheme();
  if (THEME_OPTIONS.has(saved)) {
    return saved;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  const nextTheme = THEME_OPTIONS.has(theme) ? theme : 'light';
  document.documentElement.dataset.theme = nextTheme;
  writeStoredTheme(nextTheme);

  document.querySelectorAll('[data-theme-choice]').forEach((button) => {
    const active = button.dataset.themeChoice === nextTheme;
    button.setAttribute('aria-pressed', String(active));
    button.dataset.active = String(active);
  });
}

function bindThemeButtons() {
  document.querySelectorAll('[data-theme-choice]').forEach((button) => {
    button.addEventListener('click', () => {
      applyTheme(button.dataset.themeChoice);
    });
  });
}

function initializeTheme() {
  applyTheme(getPreferredTheme());
  bindThemeButtons();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeTheme, { once: true });
} else {
  initializeTheme();
}
