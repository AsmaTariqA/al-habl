'use client';

import { useEffect, useState } from 'react';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // ⬅️ prevents hydration mismatch

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'day' : 'night'} mode`}
      className="glass-chip inline-flex h-11 w-11 items-center justify-center border border-[var(--glass-border)] bg-[var(--glass-strong)] text-[var(--text)] shadow-[0_16px_40px_var(--shadow-deep)] transition-transform duration-300 hover:-translate-y-0.5 hover:border-[var(--gold-border)] hover:text-[var(--gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ink)]"
      type="button"
    >
      {theme === 'dark' ? (
        // moon
        <svg className="h-5 w-5 text-[var(--gold)]" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      ) : (
        // sun
        <svg className="h-5 w-5 text-[var(--gold)]" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1Zm0 12a4 4 0 100-8 4 4 0 000 8Z..."
            clipRule="evenodd"
          />
        </svg>
      )}
    </button>
  );
}