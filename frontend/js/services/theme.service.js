export const THEMES = [
  {
    id: 'dark-forest',
    name: 'Dark Forest',
    desc: 'Default · deep green',
    bg: '#111814',
    accent: '#13ec80',
    dark: true,
  },
  {
    id: 'dark-midnight',
    name: 'Dark Midnight',
    desc: 'Navy blue · cyan glow',
    bg: '#0d1117',
    accent: '#38bdf8',
    dark: true,
  },
  {
    id: 'light-cloud',
    name: 'Light Cloud',
    desc: 'Clean white · emerald',
    bg: '#f8fafb',
    accent: '#10b981',
    dark: false,
  },
  {
    id: 'light-amber',
    name: 'Light Amber',
    desc: 'Warm cream · golden',
    bg: '#fffbf0',
    accent: '#f59e0b',
    dark: false,
  },
];

export function applyTheme(id) {
  const theme = THEMES.find(t => t.id === id) || THEMES[0];
  const html = document.documentElement;
  html.setAttribute('data-theme', theme.id);
  if (theme.dark) {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
  localStorage.setItem('mm-theme', theme.id);
}

export function loadTheme() {
  const saved = localStorage.getItem('mm-theme') || 'dark-forest';
  applyTheme(saved);
  return saved;
}

export function getCurrentThemeId() {
  return localStorage.getItem('mm-theme') || 'dark-forest';
}
