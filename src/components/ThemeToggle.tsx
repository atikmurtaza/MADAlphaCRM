'use client';

import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    let saved: 'light' | 'dark' = 'light';
    try { if (localStorage.getItem('theme') === 'dark') saved = 'dark'; } catch {}
    setTheme(saved);
    document.documentElement.dataset.theme = saved;
  }, []);

  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch {}
  };

  return (
    <button className="theme-toggle" onClick={toggle} aria-label="Toggle light / dark theme" title="Toggle theme">
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
