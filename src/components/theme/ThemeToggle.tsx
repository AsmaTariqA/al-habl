'use client';

import { useEffect, useState } from 'react';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      type="button"
      className="glass-chip relative inline-flex h-9 w-9 items-center justify-center rounded-xl"
      style={{
        background: 'var(--glass-strong)',
        border: '1px solid var(--glass-border)',
        color: 'var(--muted)',
        cursor: 'pointer',
        transition: 'color 0.2s ease, border-color 0.2s ease, background 0.2s ease, transform 0.2s var(--ease-bounce)',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--gold-border)';
        (e.currentTarget as HTMLButtonElement).style.color = 'var(--gold)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--glass-border)';
        (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)';
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          transition: 'opacity 0.2s ease, transform 0.3s var(--ease-out-expo)',
          opacity: 1,
          transform: 'rotate(0deg)',
        }}
      >
        {isDark ? (
          /* Moon icon */
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        ) : (
          /* Sun icon */
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round"/>
          </svg>
        )}
      </span>
    </button>
  );
}