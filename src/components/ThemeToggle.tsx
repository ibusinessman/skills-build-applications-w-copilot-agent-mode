import { Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme');
    setIsDark(current !== 'light');
  }, []);

  const toggle = () => {
    const next = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    setIsDark(!isDark);
  };

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg transition-colors hover:bg-white/10"
      style={{ color: 'var(--text-secondary)' }}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
